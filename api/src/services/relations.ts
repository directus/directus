import { useEnv } from '@directus/env';
import { ForbiddenError, InvalidPayloadError } from '@directus/errors';
import type { ForeignKey, SchemaInspector } from '@directus/schema';
import { createInspector } from '@directus/schema';
import { systemRelationRows } from '@directus/system-data';
import type {
	AbstractServiceOptions,
	Accountability,
	ActionEventParams,
	MutationOptions,
	Query,
	QueryOptions,
	Relation,
	RelationMeta,
	SchemaOverview,
} from '@directus/types';
import { toArray } from '@directus/utils';
import type Keyv from 'keyv';
import type { Knex } from 'knex';
import { clearSystemCache, getCache, getCacheValue, setCacheValue } from '../cache.js';
import type { Helpers } from '../database/helpers/index.js';
import { getHelpers } from '../database/helpers/index.js';
import getDatabase, { getSchemaInspector } from '../database/index.js';
import emitter from '../emitter.js';
import { fetchAllowedFieldMap } from '../permissions/modules/fetch-allowed-field-map/fetch-allowed-field-map.js';
import { fetchAllowedFields } from '../permissions/modules/fetch-allowed-fields/fetch-allowed-fields.js';
import { validateAccess } from '../permissions/modules/validate-access/validate-access.js';
import { getDefaultIndexName } from '../utils/get-default-index-name.js';
import { getSchema } from '../utils/get-schema.js';
import { transaction } from '../utils/transaction.js';
import { ItemsService } from './items.js';
import { ShadowsService } from './shadow.js';

const env = useEnv();

export class RelationsService {
	knex: Knex;
	schemaInspector: SchemaInspector;
	accountability: Accountability | null;
	schema: SchemaOverview;
	relationsItemService: ItemsService<RelationMeta>;
	systemCache: Keyv<any>;
	schemaCache: Keyv<any>;
	helpers: Helpers;

	constructor(options: AbstractServiceOptions) {
		this.knex = options.knex || getDatabase();
		this.schemaInspector = options.knex ? createInspector(options.knex) : getSchemaInspector();
		this.schema = options.schema;
		this.accountability = options.accountability || null;

		this.relationsItemService = new ItemsService('directus_relations', {
			knex: this.knex,
			schema: this.schema,
			// We don't set accountability here. If you have read access to certain fields, you are
			// allowed to extract the relations regardless of permissions to directus_relations. This
			// happens in `filterForbidden` down below
		});

		const cache = getCache();
		this.systemCache = cache.systemCache;
		this.schemaCache = cache.localSchemaCache;
		this.helpers = getHelpers(this.knex);
	}

	async foreignKeys(collection?: string) {
		const schemaCacheIsEnabled = Boolean(env['CACHE_SCHEMA']);

		let foreignKeys: ForeignKey[] | null = null;

		if (schemaCacheIsEnabled) {
			foreignKeys = await getCacheValue(this.schemaCache, 'foreignKeys');
		}

		if (!foreignKeys) {
			foreignKeys = await this.schemaInspector.foreignKeys();

			if (schemaCacheIsEnabled) {
				setCacheValue(this.schemaCache, 'foreignKeys', foreignKeys);
			}
		}

		if (collection) {
			return foreignKeys.filter((row) => row.table === collection);
		}

		return foreignKeys;
	}

	async readAll(collection?: string, opts?: QueryOptions, bypassCache?: boolean): Promise<Relation[]> {
		if (this.accountability) {
			await validateAccess(
				{
					accountability: this.accountability,
					action: 'read',
					collection: 'directus_relations',
				},
				{
					knex: this.knex,
					schema: this.schema,
				},
			);
		}

		const metaReadQuery: Query = {
			limit: -1,
		};

		if (collection) {
			metaReadQuery.filter = {
				many_collection: {
					_eq: collection,
				},
			};
		}

		const metaRows = [
			...(await this.relationsItemService.readByQuery(metaReadQuery, opts)),
			...systemRelationRows,
		].filter((metaRow) => {
			if (!collection) return true;
			return metaRow.many_collection === collection;
		});

		let schemaRows = bypassCache ? await this.schemaInspector.foreignKeys() : await this.foreignKeys(collection);

		if (collection && bypassCache) {
			schemaRows = schemaRows.filter((row) => row.table === collection);
		}

		const results = this.stitchRelations(metaRows, schemaRows);
		return await this.filterForbidden(results);
	}

	async readOne(collection: string, field: string): Promise<Relation> {
		if (this.accountability && this.accountability.admin !== true) {
			await validateAccess(
				{
					accountability: this.accountability,
					action: 'read',
					collection: 'directus_relations',
				},
				{
					schema: this.schema,
					knex: this.knex,
				},
			);

			const allowedFields = await fetchAllowedFields(
				{ collection, action: 'read', accountability: this.accountability },
				{ schema: this.schema, knex: this.knex },
			);

			if (allowedFields.includes('*') === false && allowedFields.includes(field) === false) {
				throw new ForbiddenError();
			}
		}

		const metaRow = await this.relationsItemService.readByQuery({
			limit: 1,
			filter: {
				_and: [
					{
						many_collection: {
							_eq: collection,
						},
					},
					{
						many_field: {
							_eq: field,
						},
					},
				],
			},
		});

		const schemaRow = (await this.foreignKeys(collection)).find((foreignKey) => foreignKey.column === field);

		const stitched = this.stitchRelations(metaRow, schemaRow ? [schemaRow] : []);
		const results = await this.filterForbidden(stitched);

		if (results.length === 0) {
			throw new ForbiddenError();
		}

		return results[0]!;
	}

	/**
	 * Create a new relationship / foreign key constraint
	 */
	async createOne(relation: Partial<Relation>, opts?: MutationOptions): Promise<void> {
		if (this.accountability && this.accountability.admin !== true) {
			throw new ForbiddenError();
		}

		if (!relation.collection) {
			throw new InvalidPayloadError({ reason: '"collection" is required' });
		}

		if (!relation.field) {
			throw new InvalidPayloadError({ reason: '"field" is required' });
		}

		const collectionSchema = this.schema.collections[relation.collection];

		if (!collectionSchema) {
			throw new InvalidPayloadError({ reason: `Collection "${relation.collection}" doesn't exist` });
		}

		const fieldSchema = collectionSchema.fields[relation.field];

		if (!fieldSchema) {
			throw new InvalidPayloadError({
				reason: `Field "${relation.field}" doesn't exist in collection "${relation.collection}"`,
			});
		}

		// A primary key should not be a foreign key
		if (collectionSchema.primary === relation.field) {
			throw new InvalidPayloadError({
				reason: `Field "${relation.field}" in collection "${relation.collection}" is a primary key`,
			});
		}

		if (relation.related_collection && relation.related_collection in this.schema.collections === false) {
			throw new InvalidPayloadError({ reason: `Collection "${relation.related_collection}" doesn't exist` });
		}

		const existingRelation = this.schema.relations.find(
			(existingRelation) =>
				existingRelation.collection === relation.collection && existingRelation.field === relation.field,
		);

		if (existingRelation) {
			throw new InvalidPayloadError({
				reason: `Field "${relation.field}" in collection "${relation.collection}" already has an associated relationship`,
			});
		}

		const runPostColumnChange = await this.helpers.schema.preColumnChange();
		this.helpers.schema.preRelationChange(relation);

		const nestedActionEvents: ActionEventParams[] = [];

		try {
			const metaRow = {
				...(relation.meta || {}),
				many_collection: relation.collection,
				many_field: relation.field,
				one_collection: relation.related_collection || null,
			};

			await transaction(this.knex, async (trx) => {
				if (relation.related_collection) {
					await trx.schema.alterTable(relation.collection!, (table) => {
						this.alterType(table, relation, fieldSchema.nullable);

						const constraintName: string = getDefaultIndexName('foreign', relation.collection!, relation.field!);

						const builder = table
							.foreign(relation.field!, constraintName)
							.references(
								`${relation.related_collection!}.${this.schema.collections[relation.related_collection!]!.primary}`,
							);

						if (relation.schema?.on_delete) {
							builder.onDelete(relation.schema.on_delete);
						}

						if (relation.schema?.on_update) {
							builder.onUpdate(relation.schema.on_update);
						}
					});

					if (this.schema.collections[relation.collection!]!.versioned) {
						const shadowsService = new ShadowsService({ knex: trx, schema: this.schema });
						await shadowsService.createShadowRelation(relation);
					}
				}

				const relationsItemService = new ItemsService('directus_relations', {
					knex: trx,
					schema: this.schema,
					// We don't set accountability here. If you have read access to certain fields, you are
					// allowed to extract the relations regardless of permissions to directus_relations. This
					// happens in `filterForbidden` down below
				});

				await relationsItemService.createOne(metaRow, {
					bypassEmitAction: (params) =>
						opts?.bypassEmitAction ? opts.bypassEmitAction(params) : nestedActionEvents.push(params),
				});
			});
		} finally {
			if (runPostColumnChange) {
				await this.helpers.schema.postColumnChange();
			}

			if (opts?.autoPurgeSystemCache !== false) {
				await clearSystemCache({ autoPurgeCache: opts?.autoPurgeCache });
			}

			if (opts?.emitEvents !== false && nestedActionEvents.length > 0) {
				const updatedSchema = await getSchema();

				for (const nestedActionEvent of nestedActionEvents) {
					nestedActionEvent.context.schema = updatedSchema;
					emitter.emitAction(nestedActionEvent.event, nestedActionEvent.meta, nestedActionEvent.context);
				}
			}
		}
	}

	/**
	 * Update an existing foreign key constraint
	 *
	 * Note: You can update anything under meta, but only the `on_delete` trigger under schema
	 */
	async updateOne(
		collection: string,
		field: string,
		relation: Partial<Relation>,
		opts?: MutationOptions,
	): Promise<void> {
		if (this.accountability && this.accountability.admin !== true) {
			throw new ForbiddenError();
		}

		const collectionSchema = this.schema.collections[collection];

		if (!collectionSchema) {
			throw new InvalidPayloadError({ reason: `Collection "${collection}" doesn't exist` });
		}

		const fieldSchema = collectionSchema.fields[field];

		if (!fieldSchema) {
			throw new InvalidPayloadError({ reason: `Field "${field}" doesn't exist in collection "${collection}"` });
		}

		const existingRelation = this.schema.relations.find(
			(existingRelation) => existingRelation.collection === collection && existingRelation.field === field,
		);

		if (!existingRelation) {
			throw new InvalidPayloadError({
				reason: `Field "${field}" in collection "${collection}" doesn't have a relationship.`,
			});
		}

		const runPostColumnChange = await this.helpers.schema.preColumnChange();
		this.helpers.schema.preRelationChange(relation);

		const nestedActionEvents: ActionEventParams[] = [];

		try {
			await transaction(this.knex, async (trx) => {
				if (existingRelation.related_collection) {
					await trx.schema.alterTable(collection, async (table) => {
						let constraintName: string = getDefaultIndexName('foreign', collection, field);

						// If the FK already exists in the DB, drop it first
						if (existingRelation?.schema) {
							constraintName = existingRelation.schema.constraint_name || constraintName;
							table.dropForeign(field, constraintName);

							constraintName = this.helpers.schema.constraintName(constraintName);
							existingRelation.schema.constraint_name = constraintName;
						}

						this.alterType(table, relation, fieldSchema.nullable);

						const builder = table
							.foreign(field, constraintName || undefined)
							.references(
								`${existingRelation.related_collection!}.${
									this.schema.collections[existingRelation.related_collection!]!.primary
								}`,
							);

						if (relation.schema?.on_delete) {
							builder.onDelete(relation.schema.on_delete);
						}

						if (relation.schema?.on_update) {
							builder.onUpdate(relation.schema.on_update);
						}

						const shadowsService = new ShadowsService({ knex: trx, schema: this.schema });
						await shadowsService.updateShadowRelation(field, existingRelation);
					});
				}

				const relationsItemService = new ItemsService('directus_relations', {
					knex: trx,
					schema: this.schema,
					// We don't set accountability here. If you have read access to certain fields, you are
					// allowed to extract the relations regardless of permissions to directus_relations. This
					// happens in `filterForbidden` down below
				});

				if (relation.meta) {
					if (existingRelation?.meta) {
						await relationsItemService.updateOne(existingRelation.meta.id, relation.meta, {
							bypassEmitAction: (params) =>
								opts?.bypassEmitAction ? opts.bypassEmitAction(params) : nestedActionEvents.push(params),
						});
					} else {
						await relationsItemService.createOne(
							{
								...(relation.meta || {}),
								many_collection: relation.collection,
								many_field: relation.field,
								one_collection: existingRelation.related_collection || null,
							},
							{
								bypassEmitAction: (params) =>
									opts?.bypassEmitAction ? opts.bypassEmitAction(params) : nestedActionEvents.push(params),
							},
						);
					}
				}
			});
		} finally {
			if (runPostColumnChange) {
				await this.helpers.schema.postColumnChange();
			}

			if (opts?.autoPurgeSystemCache !== false) {
				await clearSystemCache({ autoPurgeCache: opts?.autoPurgeCache });
			}

			if (opts?.emitEvents !== false && nestedActionEvents.length > 0) {
				const updatedSchema = await getSchema();

				for (const nestedActionEvent of nestedActionEvents) {
					nestedActionEvent.context.schema = updatedSchema;
					emitter.emitAction(nestedActionEvent.event, nestedActionEvent.meta, nestedActionEvent.context);
				}
			}
		}
	}

	/**
	 * Delete an existing relationship
	 */
	async deleteOne(collection: string, field: string, opts?: MutationOptions): Promise<void> {
		if (this.accountability && this.accountability.admin !== true) {
			throw new ForbiddenError();
		}

		if (collection in this.schema.collections === false) {
			throw new InvalidPayloadError({ reason: `Collection "${collection}" doesn't exist` });
		}

		if (field in this.schema.collections[collection]!.fields === false) {
			throw new InvalidPayloadError({ reason: `Field "${field}" doesn't exist in collection "${collection}"` });
		}

		const existingRelation = this.schema.relations.find(
			(existingRelation) => existingRelation.collection === collection && existingRelation.field === field,
		);

		if (!existingRelation) {
			throw new InvalidPayloadError({
				reason: `Field "${field}" in collection "${collection}" doesn't have a relationship.`,
			});
		}

		const runPostColumnChange = await this.helpers.schema.preColumnChange();
		const nestedActionEvents: ActionEventParams[] = [];

		try {
			await transaction(this.knex, async (trx) => {
				const existingConstraints = await this.foreignKeys();
				const constraintNames = existingConstraints.map((key) => key.constraint_name);

				if (
					existingRelation.schema?.constraint_name &&
					constraintNames.includes(existingRelation.schema.constraint_name)
				) {
					await trx.schema.alterTable(existingRelation.collection, (table) => {
						table.dropForeign(existingRelation.field, existingRelation.schema!.constraint_name!);
					});

					if (this.schema.collections[collection]?.versioned) {
						const shadowsService = new ShadowsService({ knex: trx, schema: this.schema });
						await shadowsService.deleteShadowRelation(existingRelation, { constraints: constraintNames });
					}
				}

				if (existingRelation.meta) {
					await trx('directus_relations').delete().where({ many_collection: collection, many_field: field });
				}

				const actionEvent = {
					event: 'relations.delete',
					meta: {
						payload: [field],
						collection: collection,
					},
					context: {
						database: this.knex,
						schema: this.schema,
						accountability: this.accountability,
					},
				};

				if (opts?.bypassEmitAction) {
					opts.bypassEmitAction(actionEvent);
				} else {
					nestedActionEvents.push(actionEvent);
				}
			});
		} finally {
			if (runPostColumnChange) {
				await this.helpers.schema.postColumnChange();
			}

			if (opts?.autoPurgeSystemCache !== false) {
				await clearSystemCache({ autoPurgeCache: opts?.autoPurgeCache });
			}

			if (opts?.emitEvents !== false && nestedActionEvents.length > 0) {
				const updatedSchema = await getSchema();

				for (const nestedActionEvent of nestedActionEvents) {
					nestedActionEvent.context.schema = updatedSchema;
					emitter.emitAction(nestedActionEvent.event, nestedActionEvent.meta, nestedActionEvent.context);
				}
			}
		}
	}

	/**
	 * Combine raw schema foreign key information with Directus relations meta rows to form final
	 * Relation objects
	 */
	private stitchRelations(metaRows: RelationMeta[], schemaRows: ForeignKey[]) {
		const results = schemaRows.map((foreignKey): Relation => {
			return {
				collection: foreignKey.table,
				field: foreignKey.column,
				related_collection: foreignKey.foreign_key_table,
				schema: foreignKey,
				meta:
					metaRows.find((meta) => {
						if (meta.many_collection !== foreignKey.table) return false;
						if (meta.many_field !== foreignKey.column) return false;
						if (meta.one_collection && meta.one_collection !== foreignKey.foreign_key_table) return false;
						return true;
					}) || null,
			};
		});

		/**
		 * Meta rows that don't have a corresponding schema foreign key
		 */
		const remainingMetaRows = metaRows
			.filter((meta) => {
				return !results.find((relation) => relation.meta === meta);
			})
			.map((meta): Relation => {
				return {
					collection: meta.many_collection,
					field: meta.many_field,
					related_collection: meta.one_collection ?? null,
					schema: null,
					meta: meta,
				};
			});

		results.push(...remainingMetaRows);

		return results;
	}

	/**
	 * Loop over all relations and filter out the ones that contain collections/fields you don't have
	 * permissions to
	 */
	private async filterForbidden(relations: Relation[]): Promise<Relation[]> {
		if (this.accountability === null || this.accountability?.admin === true) return relations;

		const allowedFields = await fetchAllowedFieldMap(
			{
				accountability: this.accountability,
				action: 'read',
			},
			{ schema: this.schema, knex: this.knex },
		);

		const allowedCollections = Object.keys(allowedFields);

		relations = toArray(relations);

		return relations.filter((relation) => {
			let collectionsAllowed = true;
			let fieldsAllowed = true;

			if (allowedCollections.includes(relation.collection) === false) {
				collectionsAllowed = false;
			}

			if (relation.related_collection && allowedCollections.includes(relation.related_collection) === false) {
				collectionsAllowed = false;
			}

			if (
				relation.meta?.one_allowed_collections &&
				relation.meta?.one_allowed_collections.every((collection) => allowedCollections.includes(collection)) === false
			) {
				collectionsAllowed = false;
			}

			if (
				!allowedFields[relation.collection] ||
				(allowedFields[relation.collection]?.includes('*') === false &&
					allowedFields[relation.collection]?.includes(relation.field) === false)
			) {
				fieldsAllowed = false;
			}

			if (
				relation.related_collection &&
				relation.meta?.one_field &&
				(!allowedFields[relation.related_collection] ||
					(allowedFields[relation.related_collection]?.includes('*') === false &&
						allowedFields[relation.related_collection]?.includes(relation.meta.one_field) === false))
			) {
				fieldsAllowed = false;
			}

			return collectionsAllowed && fieldsAllowed;
		});
	}

	/**
	 * MySQL Specific
	 *
	 * MySQL doesn't accept FKs from `int` to `int unsigned`. `knex` defaults `.increments()` to
	 * `unsigned`, but defaults regular `int` to `int`. This means that created m2o fields have the
	 * wrong type. This step will force the m2o `int` field into `unsigned`, but only if both types are
	 * integers, and only if we go from `int` to `int unsigned`.
	 *
	 * @TODO This is a bit of a hack, and might be better of abstracted elsewhere
	 */
	private alterType(table: Knex.TableBuilder, relation: Partial<Relation>, nullable: boolean) {
		const m2oFieldDBType = this.schema.collections[relation.collection!]!.fields[relation.field!]!.dbType;

		const relatedFieldDBType =
			this.schema.collections[relation.related_collection!]!.fields[
				this.schema.collections[relation.related_collection!]!.primary
			]!.dbType;

		if (m2oFieldDBType !== relatedFieldDBType && m2oFieldDBType === 'int' && relatedFieldDBType === 'int unsigned') {
			const alterField = table.specificType(relation.field!, 'int unsigned');

			// Maintains the non-nullable state
			if (!nullable) {
				alterField.notNullable();
			}

			alterField.alter();
		}
	}
}
