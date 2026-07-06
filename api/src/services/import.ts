import { randomUUID } from 'node:crypto';
import { createReadStream, createWriteStream } from 'node:fs';
import type { Readable, Writable } from 'node:stream';
import { useEnv } from '@directus/env';
import {
	ForbiddenError,
	InvalidForeignKeyError,
	InvalidPayloadError,
	LimitExceededError,
	TimeoutError,
	UnsupportedMediaTypeError,
} from '@directus/errors';
import { isSystemCollection } from '@directus/system-data';
import type {
	AbstractServiceOptions,
	Accountability,
	ActionEventParams,
	MutationOptions,
	PrimaryKey,
	SchemaOverview,
} from '@directus/types';
import { isObject, parseJSON, toArray } from '@directus/utils';
import { createTmpFile } from '@directus/utils/node';
import { queue } from 'async';
import type { Knex } from 'knex';
import { set } from 'lodash-es';
import ms, { type StringValue } from 'ms';
import Papa from 'papaparse';
import StreamArray from 'stream-json/streamers/StreamArray.js';
import { getCache } from '../cache.js';
import getDatabase from '../database/index.js';
import emitter from '../emitter.js';
import { useLogger } from '../logger/index.js';
import { validateAccess } from '../permissions/modules/validate-access/validate-access.js';
import { buildImportPlan, type FkFieldInfo, type ImportCollectionData } from '../utils/build-import-plan.js';
import { destroyPipedStream } from '../utils/destroy-piped-stream.js';
import { getService } from '../utils/get-service.js';
import { useStore } from '../utils/store.js';
import { transaction } from '../utils/transaction.js';
import { userName } from '../utils/user-name.js';
import { createErrorTracker } from './error-tracker.js';
import { NotificationsService } from './notifications.js';
import { UsersService } from './users.js';

const env = useEnv();
const logger = useLogger();

const store = useStore<{ importCount: number | undefined }>(String(env['IMPORT_EXPORT_NAMESPACE']), {
	ttl: ms((env['IMPORT_TIMEOUT'] as StringValue) ?? '1h'),
});

export type ImportBatchMode = 'add' | 'merge';

export interface ImportBatchOptions {
	mode?: ImportBatchMode;
	dryRun?: boolean;
}

export interface ImportBatchCollectionResult {
	existing: PrimaryKey[];
	new: PrimaryKey[];
	mapped: Record<string, PrimaryKey>;
}

export interface ImportBatchResult {
	applied: boolean;
	mode: ImportBatchMode;
	collections: Record<string, ImportBatchCollectionResult>;
}

class DryRunRollback extends Error {}

export class ImportService {
	knex: Knex;
	accountability: Accountability | null;
	schema: SchemaOverview;

	constructor(options: AbstractServiceOptions) {
		this.knex = options.knex || getDatabase();
		this.accountability = options.accountability || null;
		this.schema = options.schema;
	}

	private async acquireImportSlot(): Promise<void> {
		const limitReached = await store(async (store) => {
			const count = (await store.get('importCount')) ?? 0;

			if (count >= Number(env['IMPORT_MAX_CONCURRENCY'])) return true;

			await store.set('importCount', count + 1);
			return false;
		});

		if (limitReached) {
			throw new LimitExceededError({
				category: 'Concurrent import',
			});
		}
	}

	private async releaseImportSlot(): Promise<void> {
		try {
			await store(async (store) => {
				const count = (await store.get('importCount')) ?? 0;
				await store.set('importCount', count - 1);
			});
		} catch (error) {
			logger.error(error, `Failed to decrement importCount`);
		}
	}

	async import(
		collection: string,
		mimetype: string,
		stream: Readable,
		options?: { background: boolean },
	): Promise<void> {
		if (this.accountability?.admin !== true && isSystemCollection(collection)) throw new ForbiddenError();

		if (this.accountability) {
			await validateAccess(
				{
					accountability: this.accountability,
					action: 'create',
					collection,
				},
				{
					schema: this.schema,
					knex: this.knex,
				},
			);

			await validateAccess(
				{
					accountability: this.accountability,
					action: 'update',
					collection,
				},
				{
					schema: this.schema,
					knex: this.knex,
				},
			);
		}

		if (['application/json', 'text/csv', 'application/vnd.ms-excel'].includes(mimetype) === false) {
			throw new UnsupportedMediaTypeError({ mediaType: mimetype, where: 'file import' });
		}

		await this.acquireImportSlot();

		let promise: Promise<void>;

		if (mimetype === 'application/json') {
			promise = this.importJSON(collection, stream);
		} else {
			promise = this.importCSV(collection, stream);
		}

		if (options?.background) {
			const notify = async (subject: string, message: string) => {
				try {
					if (!this.accountability?.user) return;

					const notificationsService = new NotificationsService({
						schema: this.schema,
					});

					const usersService = new UsersService({
						schema: this.schema,
					});

					const user = await usersService.readOne(this.accountability.user, {
						fields: ['first_name', 'last_name', 'email'],
					});

					await notificationsService.createOne({
						recipient: this.accountability.user,
						sender: this.accountability.user,
						subject,
						message: `Hello ${userName(user)},\n\n${message}\n`,
					});
				} catch (error) {
					logger.error(error, `Failed to notify user`);
				}
			};

			promise
				.then(async () => {
					await notify('Your import has been successful', `Your import in ${collection} has been successful.`);
				})
				.catch(async (error) => {
					logger.error(error, `Background import to ${collection} failed`);

					await notify(
						'Your import has failed',
						`Your import in ${collection} has failed.\n\n${(error as any).message ?? ''}`,
					);
				})
				.finally(async () => await this.releaseImportSlot());
		} else {
			try {
				await promise;
			} finally {
				await this.releaseImportSlot();
			}
		}
	}

	async importJSON(collection: string, stream: Readable): Promise<void> {
		const extractJSON = StreamArray.withParser();
		const nestedActionEvents: ActionEventParams[] = [];
		const errorTracker = createErrorTracker();
		const isSingleton = this.schema.collections[collection]?.singleton ?? false;
		let timeout: NodeJS.Timeout;

		return transaction(this.knex, async (trx) => {
			const service = getService(collection, {
				knex: trx,
				schema: this.schema,
				accountability: this.accountability,
			});

			try {
				await new Promise<void>((resolve, reject) => {
					let rowNumber = 1;

					const saveQueue = queue(async (task: { data: Record<string, unknown>; rowNumber: number }) => {
						if (errorTracker.shouldStop()) return;

						try {
							if (isSingleton) {
								return await service.upsertSingleton(task.data, {
									bypassEmitAction: (params) => nestedActionEvents.push(params),
								});
							} else {
								return await service.upsertOne(task.data, {
									bypassEmitAction: (params) => nestedActionEvents.push(params),
								});
							}
						} catch (error) {
							for (const err of toArray(error)) {
								errorTracker.addCapturedError(err, task.rowNumber);

								if (errorTracker.shouldStop()) {
									break;
								}
							}

							if (errorTracker.shouldStop()) {
								saveQueue.kill();

								destroyPipedStream(extractJSON, stream);
								reject();
							}

							return;
						}
					});

					stream.pipe(extractJSON);

					extractJSON.on('data', ({ value }: Record<string, any>) => {
						if (isSingleton && rowNumber > 1) {
							saveQueue.kill();
							destroyPipedStream(extractJSON, stream);

							reject(
								new InvalidPayloadError({
									reason: `Cannot import multiple records into singleton collection ${collection}`,
								}),
							);

							return;
						}

						saveQueue.push({ data: value, rowNumber: rowNumber++ });
					});

					extractJSON.on('error', (err: Error) => {
						destroyPipedStream(extractJSON, stream);

						reject(new InvalidPayloadError({ reason: err.message }));
					});

					extractJSON.on('end', () => {
						// In case of empty JSON file
						if (!saveQueue.started) return resolve();

						saveQueue.drain(() => {
							if (errorTracker.hasErrors()) {
								return reject();
							}

							for (const nestedActionEvent of nestedActionEvents) {
								emitter.emitAction(nestedActionEvent.event, nestedActionEvent.meta, nestedActionEvent.context);
							}

							return resolve();
						});
					});

					const duration = ms(env['IMPORT_TIMEOUT'] as StringValue);

					timeout = setTimeout(() => {
						saveQueue.kill();
						destroyPipedStream(extractJSON, stream);
						reject(new TimeoutError({ category: 'Import', duration }));
					}, duration);
				});
			} catch (error) {
				if (!error && errorTracker.hasErrors()) {
					throw errorTracker.buildFinalErrors();
				}

				throw error;
			} finally {
				clearTimeout(timeout);
			}
		});
	}

	async importCSV(collection: string, stream: Readable): Promise<void> {
		const tmpFile = await createTmpFile().catch(() => null);
		if (!tmpFile) throw new Error('Failed to create temporary file for import');

		const nestedActionEvents: ActionEventParams[] = [];
		const errorTracker = createErrorTracker();
		const isSingleton = this.schema.collections[collection]?.singleton ?? false;
		let timeout: NodeJS.Timeout;

		return transaction(this.knex, async (trx) => {
			const service = getService(collection, {
				knex: trx,
				schema: this.schema,
				accountability: this.accountability,
			});

			try {
				await new Promise<void>((resolve, reject) => {
					const streams: (Readable | Writable)[] = [stream];
					let rowNumber = 0;

					const cleanup = (destroy = true) => {
						if (destroy) {
							for (const stream of streams) {
								stream.destroy();
							}
						}

						tmpFile.cleanup().catch(() => {
							logger.warn(`Failed to cleanup temporary import file (${tmpFile.path})`);
						});
					};

					const saveQueue = queue(async (task: { data: Record<string, unknown>; rowNumber: number }) => {
						if (errorTracker.shouldStop()) return;

						try {
							if (isSingleton) {
								return await service.upsertSingleton(task.data, {
									bypassEmitAction: (action) => nestedActionEvents.push(action),
								});
							} else {
								return await service.upsertOne(task.data, {
									bypassEmitAction: (action) => nestedActionEvents.push(action),
								});
							}
						} catch (error: any) {
							for (const err of toArray(error)) {
								errorTracker.addCapturedError(err, task.rowNumber);

								if (errorTracker.shouldStop()) {
									break;
								}
							}

							if (errorTracker.shouldStop()) {
								saveQueue.kill();
								cleanup(true);
								reject();
							}

							return;
						}
					});

					const fileWriteStream = createWriteStream(tmpFile.path)
						.on('error', (error) => {
							cleanup();
							reject(new Error('Error while writing import data to temporary file', { cause: error }));
						})
						.on('finish', () => {
							const fileReadStream = createReadStream(tmpFile.path).on('error', (error) => {
								cleanup();
								reject(new Error('Error while reading import data from temporary file', { cause: error }));
							});

							streams.push(fileReadStream);

							fileReadStream
								.pipe(
									Papa.parse(Papa.NODE_STREAM_INPUT, {
										header: true,
										transformHeader: (header) => header.trim(),
										transform: (value: string) => {
											if (value.length === 0) return;

											try {
												const parsedJson = parseJSON(value);

												if (typeof parsedJson === 'number') {
													return value;
												}

												return parsedJson;
											} catch {
												return value;
											}
										},
									}),
								)
								.on('data', (obj: Record<string, unknown>) => {
									rowNumber++;

									if (isSingleton && rowNumber > 1) {
										saveQueue.kill();
										cleanup(true);

										reject(
											new InvalidPayloadError({
												reason: `Cannot import multiple records into singleton collection ${collection}`,
											}),
										);

										return;
									}

									const result: Record<string, unknown> = {};

									for (const field in obj) {
										if (obj[field] !== undefined) {
											set(result, field, obj[field]);
										}
									}

									saveQueue.push({ data: result, rowNumber });
								})
								.on('error', (error: Error) => {
									cleanup();
									reject(new InvalidPayloadError({ reason: error.message }));
								})
								.on('end', () => {
									// In case of empty CSV file
									if (!saveQueue.started) {
										cleanup(false);

										return resolve();
									}

									saveQueue.drain(() => {
										if (!errorTracker.shouldStop()) cleanup(false);

										if (errorTracker.hasErrors()) {
											return reject();
										}

										for (const nestedActionEvent of nestedActionEvents) {
											emitter.emitAction(nestedActionEvent.event, nestedActionEvent.meta, nestedActionEvent.context);
										}

										return resolve();
									});
								});
						});

					streams.push(fileWriteStream);

					const duration = ms(env['IMPORT_TIMEOUT'] as StringValue);

					timeout = setTimeout(() => {
						saveQueue.kill();
						destroyPipedStream(fileWriteStream, stream);
						reject(new TimeoutError({ category: 'Import', duration }));
					}, duration);

					stream
						.on('error', (error) => {
							cleanup();
							reject(new Error('Error while retrieving import data', { cause: error }));
						})
						.pipe(fileWriteStream);
				});
			} catch (error) {
				if (!error && errorTracker.hasErrors()) {
					throw errorTracker.buildFinalErrors();
				}

				throw error;
			} finally {
				clearTimeout(timeout);
			}
		});
	}

	/**
	 * Import data for multiple collections in a single request. Builds a relational dependency graph
	 * from the schema, imports collections in topological order, remaps primary keys (and the foreign
	 * keys that reference them), and resolves nullable relational cycles via a second pass.
	 */
	async importBatch(input: ImportCollectionData[], options: ImportBatchOptions = {}): Promise<ImportBatchResult> {
		const mode: ImportBatchMode = options.mode ?? 'add';
		const dryRun = options.dryRun ?? false;

		const plan = buildImportPlan(input, this.schema);

		const dataByCollection = new Map<string, ImportCollectionData>();
		for (const entry of input) dataByCollection.set(entry.collection, entry);

		const deferredByCollection = new Map<string, Set<string>>();

		for (const { collection, field } of plan.deferred) {
			if (!deferredByCollection.has(collection)) deferredByCollection.set(collection, new Set());
			deferredByCollection.get(collection)!.add(field);
		}

		// Permission checks + system collection guard (mirrors this.import)
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
		const collections: Record<string, ImportBatchCollectionResult> = {};
		for (const collection of plan.order) collections[collection] = { existing: [], new: [], mapped: {} };

		await this.acquireImportSlot();

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
						let matchedExisting = false;

						if (isAutoIncrement) {
							// Always remap so the sequence keeps advancing naturally
							delete payload[pkField];
							newPk = await service.createOne(payload, mutationOptions);
						} else if (mode === 'merge') {
							matchedExisting = oldPk != null && (await this.keyExists(trx, collection, pkField, oldPk));
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

						const result = collections[collection]!;

						if (matchedExisting) {
							result.existing.push(newPk);
						} else {
							result.new.push(newPk);
						}

						if (oldPk != null) {
							idMap.set(String(oldPk), newPk);
							if (String(oldPk) !== String(newPk)) result.mapped[String(oldPk)] = newPk;
						}
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

				if (dryRun) throw new DryRunRollback();
			});

			// Only emit action events and purge the cache once the data is actually committed
			for (const nestedActionEvent of nestedActionEvents) {
				emitter.emitAction(nestedActionEvent.event, nestedActionEvent.meta, nestedActionEvent.context);
			}

			const { cache } = getCache();
			if (cache) await cache.clear();

			return { applied: true, mode, collections };
		} catch (error) {
			if (error instanceof DryRunRollback) {
				return { applied: false, mode, collections };
			}

			throw error;
		} finally {
			await this.releaseImportSlot();
		}
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
