import {
	DEFAULT_NUMERIC_PRECISION,
	DEFAULT_NUMERIC_SCALE,
	KNEX_TYPES,
	REGEX_BETWEEN_PARENS,
} from '@directus/constants';
import { useEnv } from '@directus/env';
import { ForbiddenError, InvalidPayloadError } from '@directus/errors';
import type { Column, SchemaInspector } from '@directus/schema';
import { createInspector } from '@directus/schema';
import type { Accountability, Field, FieldMeta, RawField, SchemaOverview, Type } from '@directus/types';
import { addFieldFlag, toArray } from '@directus/utils';
import type Keyv from 'keyv';
import type { Knex } from 'knex';
import { isEqual, isNil, merge } from 'lodash-es';
import { clearSystemCache, getCache, getCacheValue, setCacheValue } from '../cache.js';
import { ALIAS_TYPES, ALLOWED_DB_DEFAULT_FUNCTIONS } from '../constants.js';
import { translateDatabaseError } from '../database/errors/translate.js';
import type { Helpers } from '../database/helpers/index.js';
import { getHelpers } from '../database/helpers/index.js';
import getDatabase, { getSchemaInspector } from '../database/index.js';
import emitter from '../emitter.js';
import { fetchPermissions } from '../permissions/lib/fetch-permissions.js';
import { fetchPolicies } from '../permissions/lib/fetch-policies.js';
import { validateAccess } from '../permissions/modules/validate-access/validate-access.js';
import type { AbstractServiceOptions, ActionEventParams, MutationOptions } from '../types/index.js';
import getDefaultValue from '../utils/get-default-value.js';
import { getSystemFieldRowsWithAuthProviders } from '../utils/get-field-system-rows.js';
import getLocalType from '../utils/get-local-type.js';
import { getSchema } from '../utils/get-schema.js';
import { sanitizeColumn } from '../utils/sanitize-schema.js';
import { shouldClearCache } from '../utils/should-clear-cache.js';
import { transaction } from '../utils/transaction.js';
import { ItemsService } from './items.js';
import { PayloadService } from './payload.js';
import { RelationsService } from './relations.js';

const systemFieldRows = getSystemFieldRowsWithAuthProviders();
const env = useEnv();

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
	schemaCache: Keyv<any>;

	constructor(options: AbstractServiceOptions) {
		this.knex = options.knex || getDatabase();
		this.helpers = getHelpers(this.knex);
		this.schemaInspector = options.knex ? createInspector(options.knex) : getSchemaInspector();
		this.accountability = options.accountability || null;
		this.itemsService = new ItemsService('directus_fields', options);
		this.payloadService = new PayloadService('directus_fields', options);
		this.schema = options.schema;

		const { cache, systemCache, localSchemaCache } = getCache();

		this.cache = cache;
		this.systemCache = systemCache;
		this.schemaCache = localSchemaCache;
	}

	async columnInfo(collection?: string): Promise<Column[]>;
	async columnInfo(collection: string, field: string): Promise<Column>;
	async columnInfo(collection?: string, field?: string): Promise<Column | Column[]> {
		const schemaCacheIsEnabled = Boolean(env['CACHE_SCHEMA']);

		let columnInfo: Column[] | null = null;

		if (schemaCacheIsEnabled) {
			columnInfo = await getCacheValue(this.schemaCache, 'columnInfo');
		}

		if (!columnInfo) {
			columnInfo = await this.schemaInspector.columnInfo();

			if (schemaCacheIsEnabled) {
				setCacheValue(this.schemaCache, 'columnInfo', columnInfo);
			}
		}

		if (collection) {
			columnInfo = columnInfo.filter((column) => column.table === collection);
		}

		if (field) {
			return columnInfo.find((column) => column.name === field) as Column;
		}

		return columnInfo;
	}

	async readAll(collection?: string): Promise<Field[]> {
		let fields: FieldMeta[];

		if (this.accountability) {
			await validateAccess(
				{
					accountability: this.accountability,
					action: 'read',
					collection: 'directus_fields',
				},
				{
					schema: this.schema,
					knex: this.knex,
				},
			);
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

		const columns = (await this.columnInfo(collection)).map((column) => ({
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
			const policies = await fetchPolicies(this.accountability, { knex: this.knex, schema: this.schema });

			const permissions = await fetchPermissions(
				collection
					? {
							action: 'read',
							policies,
							collections: [collection],
							accountability: this.accountability,
					  }
					: {
							action: 'read',
							policies,
							accountability: this.accountability,
					  },
				{ knex: this.knex, schema: this.schema },
			);

			const allowedFieldsInCollection: Record<string, Set<string>> = {};

			permissions.forEach((permission) => {
				if (!allowedFieldsInCollection[permission.collection]) {
					allowedFieldsInCollection[permission.collection] = new Set();
				}

				for (const field of permission.fields ?? []) {
					allowedFieldsInCollection[permission.collection]!.add(field);
				}
			});

			if (collection && collection in allowedFieldsInCollection === false) {
				throw new ForbiddenError();
			}

			return result.filter((field) => {
				if (field.collection in allowedFieldsInCollection === false) return false;
				const allowedFields = allowedFieldsInCollection[field.collection]!;
				if (allowedFields.has('*')) return true;
				return allowedFields.has(field.field);
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
			await validateAccess(
				{
					accountability: this.accountability,
					action: 'read',
					collection,
				},
				{
					schema: this.schema,
					knex: this.knex,
				},
			);

			const policies = await fetchPolicies(this.accountability, { knex: this.knex, schema: this.schema });

			const permissions = await fetchPermissions(
				{ action: 'read', policies, collections: [collection], accountability: this.accountability },
				{ knex: this.knex, schema: this.schema },
			);

			let hasAccess = false;

			for (const permission of permissions) {
				if (permission.fields) {
					if (permission.fields.includes('*') || permission.fields.includes(field)) {
						hasAccess = true;
						break;
					}
				}
			}

			if (!hasAccess) {
				throw new ForbiddenError();
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
			column = await this.columnInfo(collection, field);
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

			await transaction(this.knex, async (trx) => {
				const itemsService = new ItemsService('directus_fields', {
					knex: trx,
					accountability: this.accountability,
					schema: this.schema,
				});

				const hookAdjustedField =
					opts?.emitEvents !== false
						? await emitter.emitFilter(
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
						  )
						: field;

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

		// 'type' is required for further checks on schema update
		if (field.schema && !field.type) {
			const existingType = this.schema.collections[collection]?.fields[field.field]?.type;
			if (existingType) field.type = existingType;
		}

		try {
			const hookAdjustedField =
				opts?.emitEvents !== false
					? await emitter.emitFilter(
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
					  )
					: field;

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
				const existingColumn = await this.columnInfo(collection, hookAdjustedField.field);

				if (existingColumn.is_primary_key) {
					if (hookAdjustedField.schema?.is_nullable === true) {
						throw new InvalidPayloadError({ reason: 'Primary key cannot be null' });
					}
				}

				// Sanitize column only when applying snapshot diff as opts is only passed from /utils/apply-diff.ts
				const columnToCompare =
					opts?.bypassLimits && opts.autoPurgeSystemCache === false ? sanitizeColumn(existingColumn) : existingColumn;

				if (!isEqual(columnToCompare, hookAdjustedField.schema)) {
					try {
						await transaction(this.knex, async (trx) => {
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

	async updateFields(collection: string, fields: RawField[], opts?: MutationOptions): Promise<string[]> {
		const nestedActionEvents: ActionEventParams[] = [];

		try {
			const fieldNames = [];

			for (const field of fields) {
				fieldNames.push(
					await this.updateField(collection, field, {
						autoPurgeCache: false,
						autoPurgeSystemCache: false,
						bypassEmitAction: (params) => nestedActionEvents.push(params),
					}),
				);
			}

			return fieldNames;
		} finally {
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
			if (opts?.emitEvents !== false) {
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
			}

			await transaction(this.knex, async (trx) => {
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

				const itemsService = new ItemsService('directus_fields', {
					knex: trx,
					accountability: this.accountability,
					schema: this.schema,
				});

				await itemsService.deleteByQuery(
					{
						filter: {
							collection: { _eq: collection },
							field: { _eq: field },
						},
					},
					{ emitEvents: false },
				);
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

	public addColumnToTable(
		table: Knex.CreateTableBuilder,
		field: RawField | Field,
		existing: Column | null = null,
	): void {
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

			column = table[type](
				field.field,
				field.schema?.numeric_precision ?? DEFAULT_NUMERIC_PRECISION,
				field.schema?.numeric_scale ?? DEFAULT_NUMERIC_SCALE,
			);
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

		const setDefaultValue = (defaultValue: string | number | boolean | null) => {
			const newDefaultValueIsString = typeof defaultValue === 'string';
			const newDefaultIsNowFunction = newDefaultValueIsString && defaultValue.toLowerCase() === 'now()';
			const newDefaultIsCurrentTimestamp = newDefaultValueIsString && defaultValue === 'CURRENT_TIMESTAMP';
			const newDefaultIsSetToCurrentTime = newDefaultIsNowFunction || newDefaultIsCurrentTimestamp;
			const newDefaultIsAFunction = newDefaultValueIsString && ALLOWED_DB_DEFAULT_FUNCTIONS.includes(defaultValue);

			const newDefaultIsTimestampWithPrecision =
				newDefaultValueIsString && defaultValue.includes('CURRENT_TIMESTAMP(') && defaultValue.includes(')');

			if (newDefaultIsSetToCurrentTime) {
				column.defaultTo(this.knex.fn.now());
			} else if (newDefaultIsTimestampWithPrecision) {
				const precision = defaultValue.match(REGEX_BETWEEN_PARENS)![1];
				column.defaultTo(this.knex.fn.now(Number(precision)));
			} else if (newDefaultIsAFunction) {
				column.defaultTo(this.knex.raw(defaultValue));
			} else {
				column.defaultTo(defaultValue);
			}
		};

		// for a new item, set the default value and nullable as provided without any further considerations
		if (!existing) {
			if (field.schema?.default_value !== undefined) {
				setDefaultValue(field.schema.default_value);
			}

			if (field.schema?.is_nullable || field.schema?.is_nullable === undefined) {
				column.nullable();
			} else {
				column.notNullable();
			}
		} else {
			// for an existing item: if nullable option changed, we have to provide the default values as well and actually vice versa
			// see https://knexjs.org/guide/schema-builder.html#alter
			// To overwrite a nullable option with the same value this is not possible for Oracle though, hence the DB helper

			if (field.schema?.default_value !== undefined || field.schema?.is_nullable !== undefined) {
				this.helpers.nullableUpdate.updateNullableValue(column, field, existing);

				let defaultValue = null;

				if (field.schema?.default_value !== undefined) {
					defaultValue = field.schema.default_value;
				} else if (existing.default_value !== undefined) {
					defaultValue = existing.default_value;
				}

				setDefaultValue(defaultValue);
			}
		}

		if (field.schema?.is_primary_key) {
			column.primary().notNullable();
		} else if (!existing?.is_primary_key) {
			// primary key will already have unique/index constraints
			if (field.schema?.is_unique === true) {
				if (!existing || existing.is_unique === false) {
					column.unique();
				}
			} else if (field.schema?.is_unique === false) {
				if (existing && existing.is_unique === true) {
					table.dropUnique([field.field]);
				}
			}

			if (field.schema?.is_indexed === true && !existing?.is_indexed) {
				column.index();
			} else if (field.schema?.is_indexed === false && existing?.is_indexed) {
				table.dropIndex([field.field]);
			}
		}

		if (existing) {
			column.alter();
		}
	}
}
