import database, { schemaInspector } from '../database';
import { Field } from '../types/field';
import { uniq } from 'lodash';
import { Accountability, AbstractServiceOptions } from '../types';
import ItemsService from '../services/items';
import { ColumnBuilder } from 'knex';
import getLocalType from '../utils/get-local-type';
import { types } from '../types';
import { FieldNotFoundException } from '../exceptions';
import Knex from 'knex';

type RawField = Partial<Field> & { field: string; type: typeof types[number] };

export default class FieldsService {
	knex: Knex;
	accountability: Accountability | null;
	service: ItemsService;

	constructor(options?: AbstractServiceOptions) {
		this.knex = options?.knex || database;
		this.accountability = options?.accountability || null;
		this.service = new ItemsService('directus_fields', options);
	}

	async fieldsInCollection(collection: string) {
		const [fields, columns] = await Promise.all([
			this.service.readByQuery({ filter: { collection: { _eq: collection } } }),
			schemaInspector.columns(collection),
		]);

		return uniq([...fields.map(({ field }) => field), ...columns.map(({ column }) => column)]);
	}

	async readAll(collection?: string) {
		let fields: Field[];

		if (collection) {
			fields = (await this.service.readByQuery({
				filter: { collection: { _eq: collection } },
			})) as Field[];
		} else {
			fields = (await this.service.readByQuery({})) as Field[];
		}

		const columns = await schemaInspector.columnInfo(collection);

		console.log(columns);

		return columns.map((column) => {
			const field = fields.find(
				(field) => field.field === column.name && field.collection === column.table
			);

			const data = {
				collection: column.table,
				field: column.name,
				type: column ? getLocalType(column.type) : 'alias',
				database: column,
				system: field || null,
			};

			return data;
		});
	}

	/** @todo add accountability */
	async readOne(collection: string, field: string, accountability?: Accountability) {
		let column;
		const fieldInfo = await this.knex
			.select('*')
			.from('directus_fields')
			.where({ collection, field })
			.first();

		try {
			column = await schemaInspector.columnInfo(collection, field);
		} catch {}

		const data = {
			collection,
			field,
			type: column ? getLocalType(column.type) : 'alias',
			database: column || null,
			system: fieldInfo || null,
		};

		return data;
	}

	async createField(
		collection: string,
		field: Partial<Field> & { field: string; type: typeof types[number] },
		accountability?: Accountability
	) {
		const itemsService = new ItemsService('directus_fields', { accountability });

		/**
		 * @todo
		 * Check if table / directus_fields row already exists
		 */

		if (field.database) {
			await database.schema.alterTable(collection, (table) => {
				let column: ColumnBuilder;

				if (!field.database) return;

				if (field.type === 'string') {
					column = table.string(
						field.field,
						field.database.max_length !== null ? field.database.max_length : undefined
					);
				} else if (['float', 'decimal'].includes(field.type)) {
					const type = field.type as 'float' | 'decimal';
					/** @todo add precision and scale support */
					column = table[type](field.field /* precision, scale */);
				} else {
					column = table[field.type](field.field);
				}

				if (field.database.default_value) {
					column.defaultTo(field.database.default_value);
				}

				if (field.database.is_nullable && field.database.is_nullable === true) {
					column.nullable();
				} else {
					column.notNullable();
				}
			});
		}

		if (field.system) {
			await itemsService.create({
				...field.system,
				collection: collection,
				field: field.field,
			});
		}
	}

	/** @todo research how to make this happen in SQLite / Redshift */

	async updateField(collection: string, field: RawField, accountability?: Accountability) {
		if (field.database) {
			await database.schema.alterTable(collection, (table) => {
				let column: ColumnBuilder;

				if (!field.database) return;

				if (field.type === 'string') {
					column = table.string(
						field.field,
						field.database.max_length !== null ? field.database.max_length : undefined
					);
				} else if (['float', 'decimal'].includes(field.type)) {
					const type = field.type as 'float' | 'decimal';
					/** @todo add precision and scale support */
					column = table[type](field.field /* precision, scale */);
				} else {
					column = table[field.type](field.field);
				}

				if (field.database.default_value) {
					column.defaultTo(field.database.default_value);
				}

				if (field.database.is_nullable && field.database.is_nullable === true) {
					column.nullable();
				} else {
					column.notNullable();
				}

				column.alter();
			});
		}

		if (field.system) {
			const record = await database
				.select<{ id: number }>('id')
				.from('directus_fields')
				.where({ collection, field: field.field })
				.first();
			if (!record) throw new FieldNotFoundException(collection, field.field);
			await database('directus_fields')
				.update(field.system)
				.where({ collection, field: field.field });
		}

		return field.field;
	}

	/** @todo save accountability */
	async deleteField(collection: string, field: string, accountability?: Accountability) {
		await database('directus_fields').delete().where({ collection, field });

		await database.schema.table(collection, (table) => {
			table.dropColumn(field);
		});
	}
}
