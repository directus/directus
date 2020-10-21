import database, { schemaInspector } from '../database';
import { Field } from '../types/field';
import { Accountability, AbstractServiceOptions, FieldMeta, Relation } from '../types';
import { ItemsService } from '../services/items';
import { ColumnBuilder } from 'knex';
import getLocalType from '../utils/get-local-type';
import { types } from '../types';
import { ForbiddenException, InvalidPayloadException } from '../exceptions';
import Knex, { CreateTableBuilder } from 'knex';
import { PayloadService } from '../services/payload';
import getDefaultValue from '../utils/get-default-value';
import cache from '../cache';
import SchemaInspector from 'knex-schema-inspector';

type RawField = Partial<Field> & { field: string; type: typeof types[number] };

export class FieldsService {
	knex: Knex;
	accountability: Accountability | null;
	itemsService: ItemsService;
	payloadService: PayloadService;
	schemaInspector: typeof schemaInspector;

	constructor(options?: AbstractServiceOptions) {
		this.knex = options?.knex || database;
		this.schemaInspector = options?.knex ? SchemaInspector(options.knex) : schemaInspector;
		this.accountability = options?.accountability || null;
		this.itemsService = new ItemsService('directus_fields', options);
		this.payloadService = new PayloadService('directus_fields');
	}

	async readAll(collection?: string): Promise<Field[]> {
		let fields: FieldMeta[];
		const nonAuthorizedItemsService = new ItemsService('directus_fields', { knex: this.knex });

		if (collection) {
			fields = (await nonAuthorizedItemsService.readByQuery({
				filter: { collection: { _eq: collection } },
				limit: -1,
			})) as FieldMeta[];
		} else {
			fields = (await nonAuthorizedItemsService.readByQuery({ limit: -1 })) as FieldMeta[];
		}

		let columns = await schemaInspector.columnInfo(collection);

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

		let aliasFields = await aliasQuery;

		const aliasTypes = ['alias', 'o2m', 'm2m', 'files', 'files', 'translations'];

		aliasFields = aliasFields.filter((field) => {
			const specials = (field.special || '').split(',');

			for (const type of aliasTypes) {
				if (specials.includes(type)) return true;
			}

			return false;
		});

		aliasFields = (await this.payloadService.processValues('read', aliasFields)) as FieldMeta[];

		const aliasFieldsAsField = aliasFields.map((field) => {
			const data = {
				collection: field.collection,
				field: field.field,
				type: field.special[0],
				schema: null,
				meta: field,
			};

			return data;
		});

		const result = [...columnsWithSystem, ...aliasFieldsAsField];

		// Filter the result so we only return the fields you have read access to
		if (this.accountability && this.accountability.admin !== true) {
			const permissions = await this.knex
				.select('collection', 'fields')
				.from('directus_permissions')
				.where({ role: this.accountability.role, action: 'read' });
			const allowedFieldsInCollection: Record<string, string[]> = {};

			permissions.forEach((permission) => {
				allowedFieldsInCollection[permission.collection] = (permission.fields || '').split(
					','
				);
			});

			if (collection && allowedFieldsInCollection.hasOwnProperty(collection) === false) {
				throw new ForbiddenException();
			}

			return result.filter((field) => {
				if (allowedFieldsInCollection.hasOwnProperty(field.collection) === false)
					return false;
				const allowedFields = allowedFieldsInCollection[field.collection];
				if (allowedFields[0] === '*') return true;
				return allowedFields.includes(field.field);
			});
		}

		return result;
	}

	async readOne(collection: string, field: string) {
		if (this.accountability && this.accountability.admin !== true) {
			const permissions = await this.knex
				.select('fields')
				.from('directus_permissions')
				.where({
					role: this.accountability.role,
					collection,
					action: 'read',
				})
				.first();

			if (!permissions) throw new ForbiddenException();
			if (permissions.fields !== '*') {
				const allowedFields = (permissions.fields || '').split(',');
				if (allowedFields.includes(field) === false) throw new ForbiddenException();
			}
		}

		let column;
		let fieldInfo = await this.knex
			.select('*')
			.from('directus_fields')
			.where({ collection, field })
			.first();

		if (fieldInfo) {
			fieldInfo = (await this.payloadService.processValues('read', fieldInfo)) as FieldMeta[];
		}

		try {
			column = await schemaInspector.columnInfo(collection, field);
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
		if (await this.schemaInspector.hasColumn(collection, field.field)) {
			throw new InvalidPayloadException(
				`Field "${field.field}" already exists in collection "${collection}"`
			);
		} else if (
			!!(await this.knex
				.select('id')
				.from('directus_fields')
				.where({ collection, field: field.field })
				.first())
		) {
			throw new InvalidPayloadException(
				`Field "${field.field}" already exists in collection "${collection}"`
			);
		}

		if (field.schema) {
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

		if (cache) {
			await cache.clear();
		}
	}

	/** @todo research how to make this happen in SQLite / Redshift */

	async updateField(collection: string, field: RawField) {
		if (this.accountability && this.accountability.admin !== true) {
			throw new ForbiddenException('Only admins can perform this action');
		}

		if (field.schema) {
			await this.knex.schema.alterTable(collection, (table) => {
				let column: ColumnBuilder;

				if (!field.schema) return;

				if (field.type === 'string') {
					column = table.string(
						field.field,
						field.schema.max_length !== null ? field.schema.max_length : undefined
					);
				} else if (['float', 'decimal'].includes(field.type)) {
					const type = field.type as 'float' | 'decimal';
					column = table[type](
						field.field,
						field.schema?.precision || 10,
						field.schema?.scale || 5
					);
				} else if (field.type === 'csv') {
					column = table.string(field.field);
				} else {
					column = table[field.type](field.field);
				}

				if (field.schema.default_value) {
					const defaultValue = field.schema.default_value.toLowerCase();

					if (defaultValue === 'now()') {
						column.defaultTo(this.knex.fn.now());
					} else {
						column.defaultTo(field.schema.default_value);
					}
				}

				if (field.schema.is_nullable !== undefined && field.schema.is_nullable === false) {
					column.notNullable();
				} else {
					column.nullable();
				}

				column.alter();
			});
		}

		if (field.meta) {
			const record = await database
				.select<{ id: number }>('id')
				.from('directus_fields')
				.where({ collection, field: field.field })
				.first();

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

		if (cache) {
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

		if (await schemaInspector.hasColumn(collection, field)) {
			await this.knex.schema.table(collection, (table) => {
				table.dropColumn(field);
			});
		}

		const relations = await this.knex
			.select<Relation[]>('*')
			.from('directus_relations')
			.where({ many_collection: collection, many_field: field })
			.orWhere({ one_collection: collection, one_field: field });

		for (const relation of relations) {
			const isM2O = relation.many_collection === collection && relation.many_field === field;

			/** @TODO M2A — Handle m2a case here */

			if (isM2O) {
				await this.knex('directus_relations')
					.delete()
					.where({ many_collection: collection, many_field: field });
				await this.deleteField(relation.one_collection!, relation.one_field!);
			} else {
				await this.knex('directus_relations')
					.update({ one_field: null })
					.where({ one_collection: collection, one_field: field });
			}
		}

		if (cache) {
			await cache.clear();
		}
	}

	public addColumnToTable(table: CreateTableBuilder, field: Field) {
		let column: ColumnBuilder;

		if (field.schema?.has_auto_increment) {
			column = table.increments(field.field);
		} else if (field.type === 'string') {
			column = table.string(field.field, field.schema?.max_length || undefined);
		} else if (['float', 'decimal'].includes(field.type)) {
			const type = field.type as 'float' | 'decimal';
			/** @todo add precision and scale support */
			column = table[type](field.field /* precision, scale */);
		} else if (field.type === 'csv') {
			column = table.string(field.field);
		} else if (field.type === 'dateTime') {
			column = table.dateTime(field.field, { useTz: false });
		} else {
			column = table[field.type](field.field);
		}

		if (field.schema?.default_value) {
			column.defaultTo(field.schema.default_value);
		}

		if (field.schema?.is_nullable !== undefined && field.schema.is_nullable === false) {
			column.notNullable();
		} else {
			column.nullable();
		}

		if (field.schema?.is_primary_key) {
			column.primary();
		}
	}
}
