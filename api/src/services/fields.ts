import database, { schemaInspector } from '../database';
import { Field } from '../types/field';
import { uniq } from 'lodash';
import { Accountability, AbstractServiceOptions, System } from '../types';
import ItemsService from '../services/items';
import { ColumnBuilder } from 'knex';
import getLocalType from '../utils/get-local-type';
import { types } from '../types';
import { FieldNotFoundException } from '../exceptions';
import Knex, { CreateTableBuilder } from 'knex';
import PayloadService from '../services/payload';
import getDefaultValue from '../utils/get-default-value';

type RawField = Partial<Field> & { field: string; type: typeof types[number] };

/**
 * @todo
 *
 * - Only allow admins to create/update/delete
 * - Only return fields you have permission to read (based on permissions)
 * - Don't use items service, as this is a different case than regular collections
 */

export default class FieldsService {
	knex: Knex;
	accountability: Accountability | null;
	itemsService: ItemsService;
	payloadService: PayloadService;

	constructor(options?: AbstractServiceOptions) {
		this.knex = options?.knex || database;
		this.accountability = options?.accountability || null;
		this.itemsService = new ItemsService('directus_fields', options);
		this.payloadService = new PayloadService('directus_fields');
	}

	async fieldsInCollection(collection: string) {
		const [fields, columns] = await Promise.all([
			this.itemsService.readByQuery({ filter: { collection: { _eq: collection } } }),
			schemaInspector.columns(collection),
		]);

		return uniq([...fields.map(({ field }) => field), ...columns.map(({ column }) => column)]);
	}

	async readAll(collection?: string) {
		let fields: System[];

		if (collection) {
			fields = (await this.itemsService.readByQuery({
				filter: { collection: { _eq: collection } },
			})) as System[];
		} else {
			fields = (await this.itemsService.readByQuery({})) as System[];
		}

		fields = (await this.payloadService.processValues('read', fields)) as System[];

		let columns = await schemaInspector.columnInfo(collection);

		columns = columns.map((column) => {
			return {
				...column,
				default_value: getDefaultValue(column),
			};
		});

		const columnsWithSystem = columns.map((column) => {
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

			return data as Field;
		});

		let aliasFields = await this.knex
			.select<System[]>('*')
			.from('directus_fields')
			.whereIn('special', ['alias', 'o2m']);

		aliasFields = (await this.payloadService.processValues('read', aliasFields)) as System[];

		const aliasFieldsAsField = aliasFields.map((field) => {
			const data = {
				collection: field.collection,
				field: field.field,
				type: field.special,
				database: null,
				system: field,
			};

			return data;
		});

		return [...columnsWithSystem, ...aliasFieldsAsField];
	}

	/** @todo add accountability */
	async readOne(collection: string, field: string) {
		let column;
		let fieldInfo = await this.knex
			.select('*')
			.from('directus_fields')
			.where({ collection, field })
			.first();

		fieldInfo = (await this.payloadService.processValues('read', fieldInfo)) as System[];

		try {
			column = await schemaInspector.columnInfo(collection, field);
			column.default_value = getDefaultValue(column);
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
		table?: CreateTableBuilder // allows collection creation to
	) {
		/**
		 * @todo
		 * Check if table / directus_fields row already exists
		 */

		if (field.database) {
			if (table) {
				this.addColumnToTable(table, field as Field);
			} else {
				await database.schema.alterTable(collection, (table) => {
					this.addColumnToTable(table, field as Field);
				});
			}
		}

		if (field.system) {
			await this.itemsService.create({
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

				if (
					field.database.is_nullable !== undefined &&
					field.database.is_nullable === false
				) {
					column.notNullable();
				} else {
					column.nullable();
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

	public addColumnToTable(table: CreateTableBuilder, field: Field) {
		let column: ColumnBuilder;

		if (field.database?.has_auto_increment) {
			column = table.increments(field.field);
		} else if (field.type === 'string') {
			column = table.string(field.field, field.database?.max_length || undefined);
		} else if (['float', 'decimal'].includes(field.type)) {
			const type = field.type as 'float' | 'decimal';
			/** @todo add precision and scale support */
			column = table[type](field.field /* precision, scale */);
		} else {
			column = table[field.type](field.field);
		}

		if (field.database?.default_value) {
			column.defaultTo(field.database.default_value);
		}

		if (field.database?.is_nullable && field.database.is_nullable === true) {
			column.nullable();
		} else {
			column.notNullable();
		}

		if (field.database?.is_primary_key) {
			column.primary();
		}
	}
}
