import SchemaInspector from '@directus/schema';
import { Knex } from 'knex';
import { Column } from 'knex-schema-inspector/dist/types/column';
import { getCache } from '../cache';
import { ALIAS_TYPES } from '../constants';
import getDatabase, { getSchemaInspector } from '../database';
import { systemFieldRows } from '../database/system-data/fields/';
import emitter from '../emitter';
import env from '../env';
import { ForbiddenException, InvalidPayloadException } from '../exceptions';
import { translateDatabaseError } from '../exceptions/database/translate';
import { ItemsService } from '../services/items';
import { PayloadService } from '../services/payload';
import { AbstractServiceOptions, SchemaOverview } from '../types';
import { Accountability } from '@directus/shared/types';
import { Field, FieldMeta, RawField, Type } from '@directus/shared/types';
import getDefaultValue from '../utils/get-default-value';
import getLocalType from '../utils/get-local-type';
import { toArray } from '@directus/shared/utils';
import { isEqual, isNil } from 'lodash';
import { RelationsService } from './relations';
import { getGeometryHelper } from '../database/helpers/geometry';
import Keyv from 'keyv';

export class FieldsService {
	knex: Knex;
	accountability: Accountability | null;
	itemsService: ItemsService;
	payloadService: PayloadService;
	schemaInspector: ReturnType<typeof SchemaInspector>;
	schema: SchemaOverview;
	cache: Keyv<any> | null;
	schemaCache: Keyv<any> | null;

	constructor(options: AbstractServiceOptions) {
		this.knex = options.knex || getDatabase();
		this.schemaInspector = options.knex ? SchemaInspector(options.knex) : getSchemaInspector();
		this.accountability = options.accountability || null;
		this.itemsService = new ItemsService('directus_fields', options);
		this.payloadService = new PayloadService('directus_fields', options);
		this.schema = options.schema;

		const { cache, schemaCache } = getCache();
		this.cache = cache;
		this.schemaCache = schemaCache;
	}

	private get hasReadAccess() {
		return !!this.schema.permissions.find((permission) => {
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

			const { type = 'alias', ...info } = column ? getLocalType(column, field) : {};
			const data = {
				collection: column.table,
				field: column.name,
				type: type,
				schema: { ...column, ...info },
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
			const data = {
				collection: field.collection,
				field: field.field,
				type: Array.isArray(field.special) ? field.special[0] : field.special,
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
			const permissions = this.schema.permissions.filter((permission) => {
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

		return result;
	}

	async readOne(collection: string, field: string): Promise<Record<string, any>> {
		if (this.accountability && this.accountability.admin !== true) {
			if (this.hasReadAccess === false) {
				throw new ForbiddenException();
			}

			const permissions = this.schema.permissions.find((permission) => {
				return permission.action === 'read' && permission.collection === collection;
			});

			if (!permissions || !permissions.fields) throw new ForbiddenException();
			if (permissions.fields.includes('*') === false) {
				const allowedFields = permissions.fields;
				if (allowedFields.includes(field) === false) throw new ForbiddenException();
			}
		}

		let column;
		let fieldInfo = await this.knex.select('*').from('directus_fields').where({ collection, field }).first();

		if (fieldInfo) {
			fieldInfo = (await this.payloadService.processValues('read', fieldInfo)) as FieldMeta[];
		}

		fieldInfo =
			fieldInfo ||
			systemFieldRows.find((fieldMeta) => fieldMeta.collection === collection && fieldMeta.field === field);

		try {
			column = await this.schemaInspector.columnInfo(collection, field);
			column.default_value = getDefaultValue(column);
		} catch {
			// Do nothing
		}

		const { type = 'alias', ...info } = column ? getLocalType(column, fieldInfo) : {};
		const data = {
			collection,
			field,
			type,
			meta: fieldInfo || null,
			schema: type == 'alias' ? null : { ...column, ...info },
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

		const exists =
			field.field in this.schema.collections[collection].fields ||
			isNil(await this.knex.select('id').from('directus_fields').where({ collection, field: field.field }).first()) ===
				false;

		// Check if field already exists, either as a column, or as a row in directus_fields
		if (exists) {
			throw new InvalidPayloadException(`Field "${field.field}" already exists in collection "${collection}"`);
		}

		await this.knex.transaction(async (trx) => {
			const itemsService = new ItemsService('directus_fields', {
				knex: trx,
				accountability: this.accountability,
				schema: this.schema,
			});

			if (field.type && ALIAS_TYPES.includes(field.type) === false) {
				if (table) {
					this.addColumnToTable(table, field as Field);
				} else {
					await trx.schema.alterTable(collection, (table) => {
						this.addColumnToTable(table, field as Field);
					});
				}
			}

			if (field.meta) {
				await itemsService.createOne({
					...field.meta,
					collection: collection,
					field: field.field,
				});
			}
		});

		if (this.cache && env.CACHE_AUTO_PURGE) {
			await this.cache.clear();
		}

		if (this.schemaCache) {
			await this.schemaCache.clear();
		}
	}

	async updateField(collection: string, field: RawField): Promise<string> {
		if (this.accountability && this.accountability.admin !== true) {
			throw new ForbiddenException();
		}

		if (field.schema) {
			const existingColumn = await this.schemaInspector.columnInfo(collection, field.field);

			if (!isEqual(existingColumn, field.schema)) {
				try {
					await this.knex.schema.alterTable(collection, (table) => {
						if (!field.schema) return;
						this.addColumnToTable(table, field, existingColumn);
					});
				} catch (err: any) {
					throw await translateDatabaseError(err);
				}
			}
		}

		if (field.meta) {
			const record = await this.knex
				.select('id')
				.from('directus_fields')
				.where({ collection, field: field.field })
				.first();

			if (record) {
				await this.itemsService.updateOne(record.id, {
					...field.meta,
					collection: collection,
					field: field.field,
				});
			} else {
				await this.itemsService.createOne({
					...field.meta,
					collection: collection,
					field: field.field,
				});
			}
		}

		if (this.cache && env.CACHE_AUTO_PURGE) {
			await this.cache.clear();
		}

		if (this.schemaCache) {
			await this.schemaCache.clear();
		}

		return field.field;
	}

	async deleteField(collection: string, field: string): Promise<void> {
		if (this.accountability && this.accountability.admin !== true) {
			throw new ForbiddenException();
		}

		await emitter.emitFilter(`fields.delete`, {
			event: `fields.delete`,
			accountability: this.accountability,
			collection: collection,
			item: field,
			action: 'delete',
			payload: null,
			schema: this.schema,
			database: this.knex,
		});

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
			const metaRow = await trx.select('id').from('directus_fields').where({ collection, field }).first();

			if (metaRow?.id) {
				// Handle recursive FK constraints
				await trx('directus_fields').update({ group: null }).where({ group: metaRow.id });
			}

			await trx('directus_fields').delete().where({ collection, field });

			if (
				this.schema.collections[collection] &&
				field in this.schema.collections[collection].fields &&
				this.schema.collections[collection].fields[field].alias === false
			) {
				await trx.schema.table(collection, (table) => {
					table.dropColumn(field);
				});
			}
		});

		if (this.cache && env.CACHE_AUTO_PURGE) {
			await this.cache.clear();
		}

		if (this.schemaCache) {
			await this.schemaCache.clear();
		}

		emitter.emitAction(`fields.delete`, {
			event: `fields.delete`,
			accountability: this.accountability,
			collection: collection,
			item: field,
			action: 'delete',
			payload: null,
			schema: this.schema,
			database: this.knex,
		});
	}

	public addColumnToTable(table: Knex.CreateTableBuilder, field: RawField | Field, alter: Column | null = null): void {
		let column: Knex.ColumnBuilder;

		// Don't attempt to add a DB column for alias / corrupt fields
		if (field.type === 'alias' || field.type === 'unknown') return;

		if (field.schema?.has_auto_increment) {
			column = table.increments(field.field);
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
		} else if (field.type === 'geometry') {
			const helper = getGeometryHelper();
			column = helper.createColumn(table, field);
		} else {
			column = table[field.type](field.field);
		}

		if (field.schema?.default_value !== undefined) {
			if (typeof field.schema.default_value === 'string' && field.schema.default_value.toLowerCase() === 'now()') {
				column.defaultTo(this.knex.fn.now());
			} else if (
				typeof field.schema.default_value === 'string' &&
				['"null"', 'null'].includes(field.schema.default_value.toLowerCase())
			) {
				column.defaultTo(null);
			} else {
				column.defaultTo(field.schema.default_value);
			}
		}

		if (field.schema?.is_nullable !== undefined && field.schema.is_nullable === false) {
			column.notNullable();
		} else {
			column.nullable();
		}

		if (field.schema?.is_unique === true) {
			if (!alter || alter.is_unique === false) {
				column.unique();
			}
		} else if (field.schema?.is_unique === false) {
			if (alter && alter.is_unique === true) {
				table.dropUnique([field.field]);
			}
		}

		if (field.schema?.is_primary_key) {
			column.primary().notNullable();
		}

		if (alter) {
			column.alter();
		}
	}
}
