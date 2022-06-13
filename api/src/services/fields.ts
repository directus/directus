import SchemaInspector from '@directus/schema';
import { Knex } from 'knex';
import { Column } from 'knex-schema-inspector/dist/types/column';
import { getCache, clearSystemCache } from '../cache';
import { ALIAS_TYPES } from '../constants';
import getDatabase, { getSchemaInspector } from '../database';
import { systemFieldRows } from '../database/system-data/fields/';
import emitter from '../emitter';
import env from '../env';
import { ForbiddenException, InvalidPayloadException } from '../exceptions';
import { translateDatabaseError } from '../exceptions/database/translate';
import { ItemsService } from '../services/items';
import { PayloadService } from '../services/payload';
import { AbstractServiceOptions } from '../types';
import { Field, FieldMeta, RawField, Type, Accountability, SchemaOverview } from '@directus/shared/types';
import getDefaultValue from '../utils/get-default-value';
import getLocalType from '../utils/get-local-type';
import { toArray, addFieldFlag } from '@directus/shared/utils';
import { isEqual, isNil } from 'lodash';
import { RelationsService } from './relations';
import { getHelpers, Helpers } from '../database/helpers';
import Keyv from 'keyv';
import { REGEX_BETWEEN_PARENS } from '@directus/shared/constants';

export class FieldsService {
	knex: Knex;
	helpers: Helpers;
	accountability: Accountability | null;
	itemsService: ItemsService;
	payloadService: PayloadService;
	schemaInspector: ReturnType<typeof SchemaInspector>;
	schema: SchemaOverview;
	cache: Keyv<any> | null;
	systemCache: Keyv<any>;

	constructor(options: AbstractServiceOptions) {
		this.knex = options.knex || getDatabase();
		this.helpers = getHelpers(this.knex);
		this.schemaInspector = options.knex ? SchemaInspector(options.knex) : getSchemaInspector();
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
			throw new ForbiddenException();
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
			default_value: getDefaultValue(column),
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
			knownCollections.includes(field.collection)
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
				throw new ForbiddenException();
			}

			return result.filter((field) => {
				if (field.collection in allowedFieldsInCollection === false) return false;
				const allowedFields = allowedFieldsInCollection[field.collection];
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
		}

		return result;
	}

	async readOne(collection: string, field: string): Promise<Record<string, any>> {
		if (this.accountability && this.accountability.admin !== true) {
			if (this.hasReadAccess === false) {
				throw new ForbiddenException();
			}

			const permissions = this.accountability.permissions!.find((permission) => {
				return permission.action === 'read' && permission.collection === collection;
			});

			if (!permissions || !permissions.fields) throw new ForbiddenException();
			if (permissions.fields.includes('*') === false) {
				const allowedFields = permissions.fields;
				if (allowedFields.includes(field) === false) throw new ForbiddenException();
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

		if (!column && !fieldInfo) throw new ForbiddenException();

		const type = getLocalType(column, fieldInfo);

		const columnWithCastDefaultValue = column
			? {
					...column,
					default_value: getDefaultValue(column),
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
		table?: Knex.CreateTableBuilder // allows collection creation to
	): Promise<void> {
		if (this.accountability && this.accountability.admin !== true) {
			throw new ForbiddenException();
		}

		try {
			const exists =
				field.field in this.schema.collections[collection].fields ||
				isNil(
					await this.knex.select('id').from('directus_fields').where({ collection, field: field.field }).first()
				) === false;

			// Check if field already exists, either as a column, or as a row in directus_fields
			if (exists) {
				throw new InvalidPayloadException(`Field "${field.field}" already exists in collection "${collection}"`);
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
					}
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
					await itemsService.createOne(
						{
							...hookAdjustedField.meta,
							collection: collection,
							field: hookAdjustedField.field,
						},
						{ emitEvents: false }
					);
				}

				emitter.emitAction(
					`fields.create`,
					{
						payload: hookAdjustedField,
						key: hookAdjustedField.field,
						collection: collection,
					},
					{
						database: getDatabase(),
						schema: this.schema,
						accountability: this.accountability,
					}
				);
			});
		} finally {
			if (this.cache && env.CACHE_AUTO_PURGE) {
				await this.cache.clear();
			}

			await clearSystemCache();
		}
	}

	async updateField(collection: string, field: RawField): Promise<string> {
		if (this.accountability && this.accountability.admin !== true) {
			throw new ForbiddenException();
		}

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
				}
			);

			const record = field.meta
				? await this.knex.select('id').from('directus_fields').where({ collection, field: field.field }).first()
				: null;

			if (hookAdjustedField.schema) {
				const existingColumn = await this.schemaInspector.columnInfo(collection, hookAdjustedField.field);

				if (!isEqual(existingColumn, hookAdjustedField.schema)) {
					try {
						await this.knex.schema.alterTable(collection, (table) => {
							if (!hookAdjustedField.schema) return;
							this.addColumnToTable(table, field, existingColumn);
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
						{ emitEvents: false }
					);
				} else {
					await this.itemsService.createOne(
						{
							...hookAdjustedField.meta,
							collection: collection,
							field: hookAdjustedField.field,
						},
						{ emitEvents: false }
					);
				}
			}

			emitter.emitAction(
				`fields.update`,
				{
					payload: hookAdjustedField,
					keys: [hookAdjustedField.field],
					collection: collection,
				},
				{
					database: getDatabase(),
					schema: this.schema,
					accountability: this.accountability,
				}
			);

			return field.field;
		} finally {
			if (this.cache && env.CACHE_AUTO_PURGE) {
				await this.cache.clear();
			}

			await clearSystemCache();
		}
	}

	async deleteField(collection: string, field: string): Promise<void> {
		if (this.accountability && this.accountability.admin !== true) {
			throw new ForbiddenException();
		}

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
				}
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
						await relationsService.deleteOne(collection, field);

						if (relation.related_collection && relation.meta?.one_field) {
							await fieldsService.deleteField(relation.related_collection, relation.meta.one_field);
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
					field in this.schema.collections[collection].fields &&
					this.schema.collections[collection].fields[field].alias === false
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
					collectionMetaUpdates.archive_field = null;
				}

				if (collectionMeta?.sort_field === field) {
					collectionMetaUpdates.sort_field = null;
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

			emitter.emitAction(
				'fields.delete',
				{
					payload: [field],
					collection: collection,
				},
				{
					database: this.knex,
					schema: this.schema,
					accountability: this.accountability,
				}
			);
		} finally {
			if (this.cache && env.CACHE_AUTO_PURGE) {
				await this.cache.clear();
			}

			await clearSystemCache();
		}
	}

	public addColumnToTable(table: Knex.CreateTableBuilder, field: RawField | Field, alter: Column | null = null): void {
		let column: Knex.ColumnBuilder;

		// Don't attempt to add a DB column for alias / corrupt fields
		if (field.type === 'alias' || field.type === 'unknown') return;

		if (field.schema?.has_auto_increment) {
			if (field.type === 'bigInteger') {
				// Create an auto-incremented big integer (MySQL, PostgreSQL) or an auto-incremented integer (other DBs)
				column = table.bigIncrements(field.field);
			} else {
				column = table.increments(field.field);
			}
		} else if (field.type === 'string') {
			column = table.string(field.field, field.schema?.max_length ?? undefined);
		} else if (['float', 'decimal'].includes(field.type)) {
			const type = field.type as 'float' | 'decimal';
			column = table[type](field.field, field.schema?.numeric_precision || 10, field.schema?.numeric_scale || 5);
		} else if (field.type === 'csv') {
			column = table.string(field.field);
		} else if (field.type === 'hash') {
			column = table.string(field.field, 255);
		} else if (field.type === 'dateTime') {
			column = table.dateTime(field.field, { useTz: false });
		} else if (field.type === 'timestamp') {
			column = table.timestamp(field.field, { useTz: true });
		} else if (field.type.startsWith('geometry')) {
			column = this.helpers.st.createColumn(table, field);
		} else {
			// @ts-ignore
			column = table[field.type](field.field);
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
