import { KNEX_TYPES, REGEX_BETWEEN_PARENS } from '@directus/constants';
import type { Column, SchemaInspector } from '@directus/schema';
import { createInspector } from '@directus/schema';
import type { Accountability, Field, FieldMeta, RawField, SchemaOverview, Type } from '@directus/types';
import { addFieldFlag, toArray } from '@directus/utils';
import type Keyv from 'keyv';
import type { Knex } from 'knex';
import { isEqual, isNil, merge } from 'lodash-es';
import { clearSystemCache, getCache } from '../cache.js';
import { ALIAS_TYPES } from '../constants.js';
import { translateDatabaseError } from '../database/errors/translate.js';
import type { Helpers } from '../database/helpers/index.js';
import { getHelpers } from '../database/helpers/index.js';
import getDatabase, { getSchemaInspector } from '../database/index.js';
import { systemFieldRows } from '../database/system-data/fields/index.js';
import emitter from '../emitter.js';
import { ForbiddenError, InvalidPayloadError } from '@directus/errors';
import { ItemsService } from './items.js';
import { PayloadService } from './payload.js';
import type { AbstractServiceOptions, ActionEventParams, MutationOptions } from '../types/index.js';
import getDefaultValue from '../utils/get-default-value.js';
import getLocalType from '../utils/get-local-type.js';
import { getSchema } from '../utils/get-schema.js';
import { sanitizeColumn } from '../utils/sanitize-schema.js';
import { shouldClearCache } from '../utils/should-clear-cache.js';
import { RelationsService } from './relations.js';

export class FieldsService {
	knex: Knex;
	helpers: Helpers;
	accountability: Accountability | null;
	itemsService: ItemsService;
	payloadService: PayloadService;
	schemaInspector: SchemaInspector;
	schema: SchemaOverview;
	cache: Keyv<any> | null;
	systemCache: Keyv<any>;

	constructor(options: AbstractServiceOptions) {
		this.knex = options.knex || getDatabase();
		this.helpers = getHelpers(this.knex);
		this.schemaInspector = options.knex ? createInspector(options.knex) : getSchemaInspector();
		this.accountability = options.accountability || null;
		this.itemsService = new ItemsService('directus_fields', options);
		this.payloadService = new PayloadService('directus_fields', options);
		this.schema = options.schema;

		const { cache, systemCache } = getCache();

		this.cache = cache;
		this.systemCache = systemCache;
	}

	private get hasReadAccess() {
		return !!this.accountability?.permissions?.find((permission) => {
			return permission.collection === 'directus_fields' && permission.action === 'read';
		});
	}

	async readAll(collection?: string): Promise<Field[]> {
		let fields: FieldMeta[];

		if (this.accountability && this.accountability.admin !== true && this.hasReadAccess === false) {
			throw new ForbiddenError();
		}

		const nonAuthorizedItemsService = new ItemsService('directus_fields', {
			knex: this.knex,
			schema: this.schema,
		});

		if (collection) {
			fields = (await nonAuthorizedItemsService.readByQuery({
				filter: { collection: { _eq: collection } },
				limit: -1,
			})) as FieldMeta[];

			fields.push(...systemFieldRows.filter((fieldMeta) => fieldMeta.collection === collection));
		} else {
			fields = (await nonAuthorizedItemsService.readByQuery({ limit: -1 })) as FieldMeta[];
			fields.push(...systemFieldRows);
		}

		const columns = (await this.schemaInspector.columnInfo(collection)).map((column) => ({
			...column,
			default_value: getDefaultValue(
				column,
				fields.find((field) => field.collection === column.table && field.field === column.name),
			),
		}));

		const columnsWithSystem = columns.map((column) => {
			const field = fields.find((field) => {
				return field.field === column.name && field.collection === column.table;
			});

			const type = getLocalType(column, field);

			const data = {
				collection: column.table,
				field: column.name,
				type: type,
				schema: column,
				meta: field || null,
			};

			return data as Field;
		});

		const aliasQuery = this.knex.select<any[]>('*').from('directus_fields');

		if (collection) {
			aliasQuery.andWhere('collection', collection);
		}

		let aliasFields = [...((await this.payloadService.processValues('read', await aliasQuery)) as FieldMeta[])];

		if (collection) {
			aliasFields.push(...systemFieldRows.filter((fieldMeta) => fieldMeta.collection === collection));
		} else {
			aliasFields.push(...systemFieldRows);
		}

		aliasFields = aliasFields.filter((field) => {
			const specials = toArray(field.special);

			for (const type of ALIAS_TYPES) {
				if (specials.includes(type)) return true;
			}

			return false;
		});

		const aliasFieldsAsField = aliasFields.map((field) => {
			const type = getLocalType(undefined, field);

			const data = {
				collection: field.collection,
				field: field.field,
				type,
				schema: null,
				meta: field,
			};

			return data;
		}) as Field[];

		const knownCollections = Object.keys(this.schema.collections);

		const result = [...columnsWithSystem, ...aliasFieldsAsField].filter((field) =>
			knownCollections.includes(field.collection),
		);

		// Filter the result so we only return the fields you have read access to
		if (this.accountability && this.accountability.admin !== true) {
			const permissions = this.accountability.permissions!.filter((permission) => {
				return permission.action === 'read';
			});

			const allowedFieldsInCollection: Record<string, string[]> = {};

			permissions.forEach((permission) => {
				allowedFieldsInCollection[permission.collection] = permission.fields ?? [];
			});

			if (collection && collection in allowedFieldsInCollection === false) {
				throw new ForbiddenError();
			}

			return result.filter((field) => {
				if (field.collection in allowedFieldsInCollection === false) return false;
				const allowedFields = allowedFieldsInCollection[field.collection]!;
				if (allowedFields[0] === '*') return true;
				return allowedFields.includes(field.field);
			});
		}

		// Update specific database type overrides
		for (const field of result) {
			if (field.meta?.special?.includes('cast-timestamp')) {
				field.type = 'timestamp';
			} else if (field.meta?.special?.includes('cast-datetime')) {
				field.type = 'dateTime';
			}

			field.type = this.helpers.schema.processFieldType(field);
		}

		return result;
	}

	async readOne(collection: string, field: string): Promise<Record<string, any>> {
		if (this.accountability && this.accountability.admin !== true) {
			if (this.hasReadAccess === false) {
				throw new ForbiddenError();
			}

			const permissions = this.accountability.permissions!.find((permission) => {
				return permission.action === 'read' && permission.collection === collection;
			});

			if (!permissions || !permissions.fields) throw new ForbiddenError();

			if (permissions.fields.includes('*') === false) {
				const allowedFields = permissions.fields;
				if (allowedFields.includes(field) === false) throw new ForbiddenError();
			}
		}

		let column = undefined;
		let fieldInfo = await this.knex.select('*').from('directus_fields').where({ collection, field }).first();

		if (fieldInfo) {
			fieldInfo = (await this.payloadService.processValues('read', fieldInfo)) as FieldMeta[];
		}

		fieldInfo =
			fieldInfo ||
			systemFieldRows.find((fieldMeta) => fieldMeta.collection === collection && fieldMeta.field === field);

		try {
			column = await this.schemaInspector.columnInfo(collection, field);
		} catch {
			// Do nothing
		}

		if (!column && !fieldInfo) throw new ForbiddenError();

		const type = getLocalType(column, fieldInfo);

		const columnWithCastDefaultValue = column
			? {
					...column,
					default_value: getDefaultValue(column, fieldInfo),
			  }
			: null;

		const data = {
			collection,
			field,
			type,
			meta: fieldInfo || null,
			schema: type === 'alias' ? null : columnWithCastDefaultValue,
		};

		return data;
	}

	async createField(
		collection: string,
		field: Partial<Field> & { field: string; type: Type | null },
		table?: Knex.CreateTableBuilder, // allows collection creation to
		opts?: MutationOptions,
	): Promise<void> {
		if (this.accountability && this.accountability.admin !== true) {
			throw new ForbiddenError();
		}

		const runPostColumnChange = await this.helpers.schema.preColumnChange();
		const nestedActionEvents: ActionEventParams[] = [];

		try {
			const exists =
				field.field in this.schema.collections[collection]!.fields ||
				isNil(
					await this.knex.select('id').from('directus_fields').where({ collection, field: field.field }).first(),
				) === false;

			// Check if field already exists, either as a column, or as a row in directus_fields
			if (exists) {
				throw new InvalidPayloadError({
					reason: `Field "${field.field}" already exists in collection "${collection}"`,
				});
			}

			// Add flag for specific database type overrides
			const flagToAdd = this.helpers.date.fieldFlagForField(field.type);

			if (flagToAdd) {
				addFieldFlag(field, flagToAdd);
			}

			await this.knex.transaction(async (trx) => {
				const itemsService = new ItemsService('directus_fields', {
					knex: trx,
					accountability: this.accountability,
					schema: this.schema,
				});

				const hookAdjustedField = await emitter.emitFilter(
					`fields.create`,
					field,
					{
						collection: collection,
					},
					{
						database: trx,
						schema: this.schema,
						accountability: this.accountability,
					},
				);

				if (hookAdjustedField.type && ALIAS_TYPES.includes(hookAdjustedField.type) === false) {
					if (table) {
						this.addColumnToTable(table, hookAdjustedField as Field);
					} else {
						await trx.schema.alterTable(collection, (table) => {
							this.addColumnToTable(table, hookAdjustedField as Field);
						});
					}
				}

				if (hookAdjustedField.meta) {
					const existingSortRecord: Record<'max', number | null> | undefined = await trx
						.from('directus_fields')
						.where(hookAdjustedField.meta?.group ? { collection, group: hookAdjustedField.meta.group } : { collection })
						.max('sort', { as: 'max' })
						.first();

					const newSortValue: number = existingSortRecord?.max ? existingSortRecord.max + 1 : 1;

					await itemsService.createOne(
						{
							...merge({ sort: newSortValue }, hookAdjustedField.meta),
							collection: collection,
							field: hookAdjustedField.field,
						},
						{ emitEvents: false },
					);
				}

				const actionEvent = {
					event: 'fields.create',
					meta: {
						payload: hookAdjustedField,
						key: hookAdjustedField.field,
						collection: collection,
					},
					context: {
						database: getDatabase(),
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

			if (shouldClearCache(this.cache, opts)) {
				await this.cache.clear();
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

	async updateField(collection: string, field: RawField, opts?: MutationOptions): Promise<string> {
		if (this.accountability && this.accountability.admin !== true) {
			throw new ForbiddenError();
		}

		const runPostColumnChange = await this.helpers.schema.preColumnChange();
		const nestedActionEvents: ActionEventParams[] = [];

		try {
			const hookAdjustedField = await emitter.emitFilter(
				`fields.update`,
				field,
				{
					keys: [field.field],
					collection: collection,
				},
				{
					database: this.knex,
					schema: this.schema,
					accountability: this.accountability,
				},
			);

			const record = field.meta
				? await this.knex.select('id').from('directus_fields').where({ collection, field: field.field }).first()
				: null;

			if (
				hookAdjustedField.type &&
				(hookAdjustedField.type === 'alias' ||
					this.schema.collections[collection]!.fields[field.field]?.type === 'alias') &&
				hookAdjustedField.type !== (this.schema.collections[collection]!.fields[field.field]?.type ?? 'alias')
			) {
				throw new InvalidPayloadError({ reason: 'Alias type cannot be changed' });
			}

			if (hookAdjustedField.schema) {
				const existingColumn = await this.schemaInspector.columnInfo(collection, hookAdjustedField.field);

				if (hookAdjustedField.schema?.is_nullable === true && existingColumn.is_primary_key) {
					throw new InvalidPayloadError({ reason: 'Primary key cannot be null' });
				}

				// Sanitize column only when applying snapshot diff as opts is only passed from /utils/apply-diff.ts
				const columnToCompare =
					opts?.bypassLimits && opts.autoPurgeSystemCache === false ? sanitizeColumn(existingColumn) : existingColumn;

				if (!isEqual(columnToCompare, hookAdjustedField.schema)) {
					try {
						await this.knex.transaction(async (trx) => {
							await trx.schema.alterTable(collection, async (table) => {
								if (!hookAdjustedField.schema) return;
								this.addColumnToTable(table, field, existingColumn);
							});
						});
					} catch (err: any) {
						throw await translateDatabaseError(err);
					}
				}
			}

			if (hookAdjustedField.meta) {
				if (record) {
					await this.itemsService.updateOne(
						record.id,
						{
							...hookAdjustedField.meta,
							collection: collection,
							field: hookAdjustedField.field,
						},
						{ emitEvents: false },
					);
				} else {
					await this.itemsService.createOne(
						{
							...hookAdjustedField.meta,
							collection: collection,
							field: hookAdjustedField.field,
						},
						{ emitEvents: false },
					);
				}
			}

			const actionEvent = {
				event: 'fields.update',
				meta: {
					payload: hookAdjustedField,
					keys: [hookAdjustedField.field],
					collection: collection,
				},
				context: {
					database: getDatabase(),
					schema: this.schema,
					accountability: this.accountability,
				},
			};

			if (opts?.bypassEmitAction) {
				opts.bypassEmitAction(actionEvent);
			} else {
				nestedActionEvents.push(actionEvent);
			}

			return field.field;
		} finally {
			if (runPostColumnChange) {
				await this.helpers.schema.postColumnChange();
			}

			if (shouldClearCache(this.cache, opts)) {
				await this.cache.clear();
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

	async deleteField(collection: string, field: string, opts?: MutationOptions): Promise<void> {
		if (this.accountability && this.accountability.admin !== true) {
			throw new ForbiddenError();
		}

		const runPostColumnChange = await this.helpers.schema.preColumnChange();
		const nestedActionEvents: ActionEventParams[] = [];

		try {
			await emitter.emitFilter(
				'fields.delete',
				[field],
				{
					collection: collection,
				},
				{
					database: this.knex,
					schema: this.schema,
					accountability: this.accountability,
				},
			);

			await this.knex.transaction(async (trx) => {
				const relations = this.schema.relations.filter((relation) => {
					return (
						(relation.collection === collection && relation.field === field) ||
						(relation.related_collection === collection && relation.meta?.one_field === field)
					);
				});

				const relationsService = new RelationsService({
					knex: trx,
					accountability: this.accountability,
					schema: this.schema,
				});

				const fieldsService = new FieldsService({
					knex: trx,
					accountability: this.accountability,
					schema: this.schema,
				});

				for (const relation of relations) {
					const isM2O = relation.collection === collection && relation.field === field;

					// If the current field is a m2o, delete the related o2m if it exists and remove the relationship
					if (isM2O) {
						await relationsService.deleteOne(collection, field, {
							autoPurgeSystemCache: false,
							bypassEmitAction: (params) =>
								opts?.bypassEmitAction ? opts.bypassEmitAction(params) : nestedActionEvents.push(params),
						});

						if (
							relation.related_collection &&
							relation.meta?.one_field &&
							relation.related_collection !== collection &&
							relation.meta.one_field !== field
						) {
							await fieldsService.deleteField(relation.related_collection, relation.meta.one_field, {
								autoPurgeCache: false,
								autoPurgeSystemCache: false,
								bypassEmitAction: (params) =>
									opts?.bypassEmitAction ? opts.bypassEmitAction(params) : nestedActionEvents.push(params),
							});
						}
					}

					// If the current field is a o2m, just delete the one field config from the relation
					if (!isM2O && relation.meta?.one_field) {
						await trx('directus_relations')
							.update({ one_field: null })
							.where({ many_collection: relation.collection, many_field: relation.field });
					}
				}

				// Delete field only after foreign key constraints are removed
				if (
					this.schema.collections[collection] &&
					field in this.schema.collections[collection]!.fields &&
					this.schema.collections[collection]!.fields[field]!.alias === false
				) {
					await trx.schema.table(collection, (table) => {
						table.dropColumn(field);
					});
				}

				const collectionMeta = await trx
					.select('archive_field', 'sort_field')
					.from('directus_collections')
					.where({ collection })
					.first();

				const collectionMetaUpdates: Record<string, null> = {};

				if (collectionMeta?.archive_field === field) {
					collectionMetaUpdates['archive_field'] = null;
				}

				if (collectionMeta?.sort_field === field) {
					collectionMetaUpdates['sort_field'] = null;
				}

				if (Object.keys(collectionMetaUpdates).length > 0) {
					await trx('directus_collections').update(collectionMetaUpdates).where({ collection });
				}

				// Cleanup directus_fields
				const metaRow = await trx
					.select('collection', 'field')
					.from('directus_fields')
					.where({ collection, field })
					.first();

				if (metaRow) {
					// Handle recursive FK constraints
					await trx('directus_fields')
						.update({ group: null })
						.where({ group: metaRow.field, collection: metaRow.collection });
				}

				await trx('directus_fields').delete().where({ collection, field });
			});

			const actionEvent = {
				event: 'fields.delete',
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
		} finally {
			if (runPostColumnChange) {
				await this.helpers.schema.postColumnChange();
			}

			if (shouldClearCache(this.cache, opts)) {
				await this.cache.clear();
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

	public addColumnToTable(table: Knex.CreateTableBuilder, field: RawField | Field, alter: Column | null = null): void {
		let column: Knex.ColumnBuilder;

		// Don't attempt to add a DB column for alias / corrupt fields
		if (field.type === 'alias' || field.type === 'unknown') return;

		if (field.schema?.has_auto_increment) {
			if (field.type === 'bigInteger') {
				column = table.bigIncrements(field.field);
			} else {
				column = table.increments(field.field);
			}
		} else if (field.type === 'string') {
			column = table.string(field.field, field.schema?.max_length ?? undefined);
		} else if (['float', 'decimal'].includes(field.type)) {
			const type = field.type as 'float' | 'decimal';
			column = table[type](field.field, field.schema?.numeric_precision ?? 10, field.schema?.numeric_scale ?? 5);
		} else if (field.type === 'csv') {
			column = table.text(field.field);
		} else if (field.type === 'hash') {
			column = table.string(field.field, 255);
		} else if (field.type === 'dateTime') {
			column = table.dateTime(field.field, { useTz: false });
		} else if (field.type === 'timestamp') {
			column = table.timestamp(field.field, { useTz: true });
		} else if (field.type.startsWith('geometry')) {
			column = this.helpers.st.createColumn(table, field);
		} else if (KNEX_TYPES.includes(field.type as (typeof KNEX_TYPES)[number])) {
			column = table[field.type as (typeof KNEX_TYPES)[number]](field.field);
		} else {
			throw new InvalidPayloadError({ reason: `Illegal type passed: "${field.type}"` });
		}

		if (field.schema?.default_value !== undefined) {
			if (
				typeof field.schema.default_value === 'string' &&
				(field.schema.default_value.toLowerCase() === 'now()' || field.schema.default_value === 'CURRENT_TIMESTAMP')
			) {
				column.defaultTo(this.knex.fn.now());
			} else if (
				typeof field.schema.default_value === 'string' &&
				field.schema.default_value.includes('CURRENT_TIMESTAMP(') &&
				field.schema.default_value.includes(')')
			) {
				const precision = field.schema.default_value.match(REGEX_BETWEEN_PARENS)![1];
				column.defaultTo(this.knex.fn.now(Number(precision)));
			} else {
				column.defaultTo(field.schema.default_value);
			}
		}

		if (field.schema?.is_nullable === false) {
			if (!alter || alter.is_nullable === true) {
				column.notNullable();
			}
		} else {
			if (!alter || alter.is_nullable === false) {
				column.nullable();
			}
		}

		if (field.schema?.is_primary_key) {
			column.primary().notNullable();
		} else if (field.schema?.is_unique === true) {
			if (!alter || alter.is_unique === false) {
				column.unique();
			}
		} else if (field.schema?.is_unique === false) {
			if (alter && alter.is_unique === true) {
				table.dropUnique([field.field]);
			}
		}

		if (alter) {
			column.alter();
		}
	}
}
