import { randomUUID } from 'node:crypto';
import { ForbiddenError, InvalidForeignKeyError, InvalidPayloadError } from '@directus/errors';
import { isSystemCollection } from '@directus/system-data';
import type {
	AbstractServiceOptions,
	Accountability,
	ActionEventParams,
	MutationOptions,
	PrimaryKey,
	SchemaOverview,
} from '@directus/types';
import { isObject } from '@directus/utils';
import type { Knex } from 'knex';
import { getCache } from '../cache.js';
import getDatabase from '../database/index.js';
import emitter from '../emitter.js';
import { validateAccess } from '../permissions/modules/validate-access/validate-access.js';
import { buildImportPlan, type FkFieldInfo, type ImportCollectionData } from '../utils/build-import-plan.js';
import { getService } from '../utils/get-service.js';
import { transaction } from '../utils/transaction.js';

export type RelationalImportMode = 'add' | 'merge';

export interface RelationalImportOptions {
	mode?: RelationalImportMode;
	dryRun?: boolean;
}

export interface RelationalImportResult {
	mode: RelationalImportMode;
	dryRun: boolean;
	/** The order in which collections were imported. */
	order: string[];
	/** Fields that were resolved in a second pass to break nullable cycles. */
	deferred: { collection: string; field: string }[];
	/** old primary key -> new primary key, per collection. */
	mappings: Record<string, Record<string, PrimaryKey>>;
}

/** Internal sentinel used to force a transaction rollback on dry runs. */
class DryRunRollback extends Error {}

/**
 * Import data for multiple collections in a single request. Builds a relational dependency graph
 * from the schema, imports collections in topological order, remaps primary keys (and the foreign
 * keys that reference them), and resolves nullable relational cycles via a second pass.
 */
export class RelationalImportService {
	knex: Knex;
	accountability: Accountability | null;
	schema: SchemaOverview;

	constructor(options: AbstractServiceOptions) {
		this.knex = options.knex || getDatabase();
		this.accountability = options.accountability || null;
		this.schema = options.schema;
	}

	async import(input: ImportCollectionData[], options: RelationalImportOptions = {}): Promise<RelationalImportResult> {
		const mode: RelationalImportMode = options.mode ?? 'add';
		const dryRun = options.dryRun ?? false;

		const plan = buildImportPlan(input, this.schema);

		const dataByCollection = new Map<string, ImportCollectionData>();
		for (const entry of input) dataByCollection.set(entry.collection, entry);

		const deferredByCollection = new Map<string, Set<string>>();

		for (const { collection, field } of plan.deferred) {
			if (!deferredByCollection.has(collection)) deferredByCollection.set(collection, new Set());
			deferredByCollection.get(collection)!.add(field);
		}

		// Permission checks + system collection guard (mirrors ImportService)
		for (const collection of plan.order) {
			if (this.accountability?.admin !== true && isSystemCollection(collection)) {
				throw new ForbiddenError();
			}

			if (this.accountability) {
				await validateAccess(
					{ accountability: this.accountability, action: 'create', collection },
					{ schema: this.schema, knex: this.knex },
				);

				// Second pass and merge mode both perform updates
				if (mode === 'merge' || deferredByCollection.has(collection)) {
					await validateAccess(
						{ accountability: this.accountability, action: 'update', collection },
						{ schema: this.schema, knex: this.knex },
					);
				}
			}
		}

		// Reject nested relational payloads before touching the database
		this.validateFlatData(plan.relationalFields, dataByCollection);

		const nestedActionEvents: ActionEventParams[] = [];
		const mappings: Record<string, Record<string, PrimaryKey>> = {};

		try {
			await transaction(this.knex, async (trx) => {
				const mutationTracker = getService(plan.order[0]!, {
					knex: trx,
					schema: this.schema,
					accountability: this.accountability,
				}).createMutationTracker();

				const mutationOptions: MutationOptions = {
					bypassEmitAction: (params) => nestedActionEvents.push(params),
					mutationTracker,
					autoPurgeCache: false,
					autoPurgeSystemCache: false,
				};

				// idMaps keyed by String(oldPk) -> new primary key, per collection
				const idMaps = new Map<string, Map<string, PrimaryKey>>();
				for (const collection of plan.order) idMaps.set(collection, new Map());

				await this.assertReferencesResolvable(trx, plan.fkFields, dataByCollection);

				// Pass 1: insert/upsert each collection in dependency order, remapping FKs and PKs
				for (const collection of plan.order) {
					const entry = dataByCollection.get(collection)!;
					const idMap = idMaps.get(collection)!;
					const deferredFields = deferredByCollection.get(collection);
					const fkFields = plan.fkFields.get(collection)!;

					const service = getService(collection, {
						knex: trx,
						schema: this.schema,
						accountability: this.accountability,
					});

					const { primary: pkField, fields } = this.schema.collections[collection]!;
					const pkOverview = fields[pkField]!;

					const isAutoIncrement =
						['integer', 'bigInteger'].includes(pkOverview.type) && pkOverview.defaultValue === 'AUTO_INCREMENT';

					const isUuid = pkOverview.type === 'uuid';

					for (const item of entry.items) {
						const payload = this.remapForeignKeys(item, fkFields, idMaps, deferredFields);
						const oldPk = item[pkField] as PrimaryKey | undefined;

						let newPk: PrimaryKey;

						if (isAutoIncrement) {
							// Always remap so the sequence keeps advancing naturally
							delete payload[pkField];
							newPk = await service.createOne(payload, mutationOptions);
						} else if (mode === 'merge') {
							newPk = await service.upsertOne(payload, mutationOptions);
						} else {
							const conflict = oldPk != null && (await this.keyExists(trx, collection, pkField, oldPk));

							if (conflict) {
								if (isUuid) {
									payload[pkField] = randomUUID();
								} else {
									throw new InvalidPayloadError({
										reason: `Item with primary key "${oldPk}" in "${collection}" conflicts with an existing record and can't be safely remapped (only uuid keys are regenerated)`,
									});
								}
							}

							newPk = await service.createOne(payload, mutationOptions);
						}

						if (oldPk != null) idMap.set(String(oldPk), newPk);
					}
				}

				// Pass 2: set the deferred fields now that every collection has been imported
				for (const { collection, field } of plan.deferred) {
					const entry = dataByCollection.get(collection)!;
					const idMap = idMaps.get(collection)!;
					const fkInfo = plan.fkFields.get(collection)!.find((info) => info.field === field)!;
					const { primary: pkField } = this.schema.collections[collection]!;

					const service = getService(collection, {
						knex: trx,
						schema: this.schema,
						accountability: this.accountability,
					});

					for (const item of entry.items) {
						const rawValue = item[field];
						if (rawValue === undefined || rawValue === null) continue;

						const oldPk = item[pkField] as PrimaryKey | undefined;
						if (oldPk == null) continue;

						const newPk = idMap.get(String(oldPk));
						if (newPk === undefined) continue;

						const value = this.remapValue(rawValue, this.resolveTarget(fkInfo, item), idMaps);

						await service.updateOne(newPk, { [field]: value }, mutationOptions);
					}
				}

				for (const [collection, idMap] of idMaps) {
					mappings[collection] = Object.fromEntries(idMap);
				}

				if (dryRun) throw new DryRunRollback();
			});
		} catch (error) {
			if (error instanceof DryRunRollback) {
				return { mode, dryRun, order: plan.order, deferred: plan.deferred, mappings };
			}

			throw error;
		}

		// Only emit action events and purge the cache once the data is actually committed
		for (const nestedActionEvent of nestedActionEvents) {
			emitter.emitAction(nestedActionEvent.event, nestedActionEvent.meta, nestedActionEvent.context);
		}

		const { cache } = getCache();
		if (cache) await cache.clear();

		return { mode, dryRun, order: plan.order, deferred: plan.deferred, mappings };
	}

	/**
	 * Reject nested relational payloads: any relational field (owning FK or o2m/alias) whose value is
	 * an object, or an array containing an object. Non-relational fields (json, csv, ...) are exempt.
	 */
	private validateFlatData(
		relationalFields: Map<string, Set<string>>,
		dataByCollection: Map<string, ImportCollectionData>,
	): void {
		for (const [collection, fields] of relationalFields) {
			if (fields.size === 0) continue;

			const entry = dataByCollection.get(collection);
			if (!entry) continue;

			for (const item of entry.items) {
				for (const field of fields) {
					const value = item[field];
					if (value === undefined || value === null) continue;

					const isNested = isObject(value) || (Array.isArray(value) && value.some((entry) => isObject(entry)));

					if (isNested) {
						throw new InvalidPayloadError({
							reason: `Nested relational data is not supported for "${collection}.${field}"; provide a scalar foreign key reference instead`,
						});
					}
				}
			}
		}
	}

	/**
	 * Verify that every scalar foreign key reference points at a primary key that is either part of
	 * this import or already present in the database. Throws {@link InvalidForeignKeyError} otherwise.
	 */
	private async assertReferencesResolvable(
		trx: Knex,
		fkFields: Map<string, FkFieldInfo[]>,
		dataByCollection: Map<string, ImportCollectionData>,
	): Promise<void> {
		const importedPks = new Map<string, Set<string>>();

		for (const [collection, entry] of dataByCollection) {
			const { primary: pkField } = this.schema.collections[collection]!;
			const set = new Set<string>();

			for (const item of entry.items) {
				const pk = item[pkField];
				if (pk !== undefined && pk !== null) set.add(String(pk));
			}

			importedPks.set(collection, set);
		}

		// candidates[target] = Map<String(value), { value, fromCollection, field }>
		const candidates = new Map<string, Map<string, { value: unknown; fromCollection: string; field: string }>>();

		for (const [collection, entry] of dataByCollection) {
			const fields = fkFields.get(collection)!;

			for (const item of entry.items) {
				for (const info of fields) {
					const value = item[info.field];
					if (value === undefined || value === null || isObject(value)) continue;

					const target = this.resolveTarget(info, item);
					if (!target || !this.schema.collections[target]) continue;

					if (importedPks.get(target)?.has(String(value))) continue;

					if (!candidates.has(target)) candidates.set(target, new Map());
					candidates.get(target)!.set(String(value), { value, fromCollection: collection, field: info.field });
				}
			}
		}

		for (const [target, valueMap] of candidates) {
			const { primary: pkField } = this.schema.collections[target]!;
			const rawValues = [...valueMap.values()].map((entry) => entry.value);

			const existing = await trx
				.select(pkField)
				.from(target)
				.whereIn(pkField, rawValues as PrimaryKey[]);

			const existingKeys = new Set(existing.map((row) => String(row[pkField])));

			for (const [key, info] of valueMap) {
				if (!existingKeys.has(key)) {
					throw new InvalidForeignKeyError({
						collection: info.fromCollection,
						field: info.field,
						value: info.value == null ? null : String(info.value),
					});
				}
			}
		}
	}

	/** Clone an item, remap its scalar foreign keys through the id maps, and drop deferred fields. */
	private remapForeignKeys(
		item: Record<string, unknown>,
		fkFields: FkFieldInfo[],
		idMaps: Map<string, Map<string, PrimaryKey>>,
		deferredFields: Set<string> | undefined,
	): Record<string, unknown> {
		const payload: Record<string, unknown> = { ...item };

		for (const info of fkFields) {
			if (deferredFields?.has(info.field)) {
				delete payload[info.field];
				continue;
			}

			const value = payload[info.field];
			if (value === undefined || value === null || isObject(value)) continue;

			payload[info.field] = this.remapValue(value, this.resolveTarget(info, item), idMaps);
		}

		return payload;
	}

	/** Map a single foreign key value through the target collection's id map (identity when unmapped). */
	private remapValue(value: unknown, target: string | null, idMaps: Map<string, Map<string, PrimaryKey>>): unknown {
		if (value === null || value === undefined || !target) return value;

		const mapped = idMaps.get(target)?.get(String(value));
		return mapped !== undefined ? mapped : value;
	}

	/** Determine the target collection for a foreign key field (static for m2o, per-item for a2o). */
	private resolveTarget(info: FkFieldInfo, item: Record<string, unknown>): string | null {
		if (info.target) return info.target;
		if (!info.collectionField) return null;

		const target = item[info.collectionField];
		return typeof target === 'string' ? target : null;
	}

	private async keyExists(trx: Knex, collection: string, pkField: string, value: PrimaryKey): Promise<boolean> {
		const result = await trx
			.select(pkField)
			.from(collection)
			.where({ [pkField]: value })
			.first();

		return Boolean(result);
	}
}
