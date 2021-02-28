import { ALIAS_TYPES } from '../constants';
import database, { schemaInspector } from '../database';
import { Field } from '../types/field';
import { Accountability, AbstractServiceOptions, FieldMeta, Relation, SchemaOverview } from '../types';
import { ItemsService } from '../services/items';
import { ColumnBuilder } from 'knex';
import getLocalType from '../utils/get-local-type';
import { types } from '../types';
import { ForbiddenException, InvalidPayloadException } from '../exceptions';
import Knex, { CreateTableBuilder } from 'knex';
import { PayloadService } from '../services/payload';
import getDefaultValue from '../utils/get-default-value';
import cache from '../cache';
import SchemaInspector from '@directus/schema';
import { toArray } from '../utils/to-array';
import env from '../env';

import { systemFieldRows } from '../database/system-data/fields/';

type RawField = Partial<Field> & { field: string; type: typeof types[number] };

export class FieldsService {
	knex: Knex;
	accountability: Accountability | null;
	itemsService: ItemsService;
	payloadService: PayloadService;
	schemaInspector: typeof schemaInspector;
	schema: SchemaOverview;

	constructor(options: AbstractServiceOptions) {
		this.knex = options.knex || database;
		this.schemaInspector = options.knex ? SchemaInspector(options.knex) : schemaInspector;
		this.accountability = options.accountability || null;
		this.itemsService = new ItemsService('directus_fields', options);
		this.payloadService = new PayloadService('directus_fields', options);
		this.schema = options.schema;
	}

	async readAll(collection?: string): Promise<Field[]> {
		let fields: FieldMeta[];
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

		let columns = await this.schemaInspector.columnInfo(collection);

		columns = columns.map((column) => {
			return {
				...column,
				default_value: getDefaultValue(column),
			};
		});

		const columnsWithSystem = columns.map((column) => {
			const field = fields.find((field) => {
				return field.field === column.name && field.collection === column.table;
			});

			const data = {
				collection: column.table,
				field: column.name,
				type: column ? getLocalType(column, field) : 'alias',
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
			const data = {
				collection: field.collection,
				field: field.field,
				type: Array.isArray(field.special) ? field.special[0] : field.special,
				schema: null,
				meta: field,
			};

			return data;
		}) as Field[];

		const result = [...columnsWithSystem, ...aliasFieldsAsField];

		// Filter the result so we only return the fields you have read access to
		if (this.accountability && this.accountability.admin !== true) {
			const permissions = this.schema.permissions.filter((permission) => {
				return permission.action === 'read';
			});

			const allowedFieldsInCollection: Record<string, string[]> = {};

			permissions.forEach((permission) => {
				allowedFieldsInCollection[permission.collection] = permission.fields ?? [];
			});

			if (collection && allowedFieldsInCollection.hasOwnProperty(collection) === false) {
				throw new ForbiddenException();
			}

			return result.filter((field) => {
				if (allowedFieldsInCollection.hasOwnProperty(field.collection) === false) return false;
				const allowedFields = allowedFieldsInCollection[field.collection];
				if (allowedFields[0] === '*') return true;
				return allowedFields.includes(field.field);
			});
		}

		return result;
	}

	async readOne(collection: string, field: string) {
		if (this.accountability && this.accountability.admin !== true) {
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
		} catch {}

		const data = {
			collection,
			field,
			type: column ? getLocalType(column, fieldInfo) : 'alias',
			meta: fieldInfo || null,
			schema: column || null,
		};

		return data;
	}

	async createField(
		collection: string,
		field: Partial<Field> & { field: string; type: typeof types[number] },
		table?: CreateTableBuilder // allows collection creation to
	) {
		if (this.accountability && this.accountability.admin !== true) {
			throw new ForbiddenException('Only admins can perform this action.');
		}

		// Check if field already exists, either as a column, or as a row in directus_fields
		if (field.field in this.schema.tables[collection].columns) {
			throw new InvalidPayloadException(`Field "${field.field}" already exists in collection "${collection}"`);
		} else if (
			!!this.schema.fields.find((fieldMeta) => fieldMeta.collection === collection && fieldMeta.field === field.field)
		) {
			throw new InvalidPayloadException(`Field "${field.field}" already exists in collection "${collection}"`);
		}

		if (field.type && ALIAS_TYPES.includes(field.type) === false) {
			if (table) {
				this.addColumnToTable(table, field as Field);
			} else {
				await database.schema.alterTable(collection, (table) => {
					this.addColumnToTable(table, field as Field);
				});
			}
		}

		if (field.meta) {
			await this.itemsService.create({
				...field.meta,
				collection: collection,
				field: field.field,
			});
		}

		if (cache && env.CACHE_AUTO_PURGE) {
			await cache.clear();
		}
	}

	async updateField(collection: string, field: RawField) {
		if (this.accountability && this.accountability.admin !== true) {
			throw new ForbiddenException('Only admins can perform this action');
		}

		if (field.schema) {
			await this.knex.schema.alterTable(collection, (table) => {
				if (!field.schema) return;
				this.addColumnToTable(table, field, true);
			});
		}

		if (field.meta) {
			const record = this.schema.fields.find(
				(fieldMeta) => fieldMeta.field === field.field && fieldMeta.collection === collection
			);

			if (record) {
				await this.itemsService.update(
					{
						...field.meta,
						collection: collection,
						field: field.field,
					},
					record.id
				);
			} else {
				await this.itemsService.create({
					...field.meta,
					collection: collection,
					field: field.field,
				});
			}
		}

		if (cache && env.CACHE_AUTO_PURGE) {
			await cache.clear();
		}

		return field.field;
	}

	/** @todo save accountability */
	async deleteField(collection: string, field: string) {
		if (this.accountability && this.accountability.admin !== true) {
			throw new ForbiddenException('Only admins can perform this action.');
		}

		await this.knex('directus_fields').delete().where({ collection, field });

		if (this.schema.tables[collection] && field in this.schema.tables[collection].columns) {
			await this.knex.schema.table(collection, (table) => {
				table.dropColumn(field);
			});
		}

		const relations = this.schema.relations.filter((relation) => {
			return (
				(relation.many_collection === collection && relation.many_field === field) ||
				(relation.one_collection === collection && relation.one_field === field)
			);
		});

		for (const relation of relations) {
			const isM2O = relation.many_collection === collection && relation.many_field === field;

			/** @TODO M2A — Handle m2a case here */

			if (isM2O) {
				await this.knex('directus_relations').delete().where({ many_collection: collection, many_field: field });
				await this.deleteField(relation.one_collection!, relation.one_field!);
			} else {
				await this.knex('directus_relations')
					.update({ one_field: null })
					.where({ one_collection: collection, one_field: field });
			}
		}

		if (cache && env.CACHE_AUTO_PURGE) {
			await cache.clear();
		}
	}

	public addColumnToTable(table: CreateTableBuilder, field: RawField | Field, alter: boolean = false) {
		let column: ColumnBuilder;

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

		if (field.schema?.is_primary_key) {
			column.primary();
		}

		if (alter) {
			column.alter();
		}
	}
}
