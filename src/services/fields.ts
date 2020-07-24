import database, { schemaInspector } from '../database';
import { Field } from '../types/field';
import { uniq } from 'lodash';
import { Accountability } from '../types';
import * as ItemsService from '../services/items';
import { ColumnBuilder } from 'knex';
import getLocalType from '../utils/get-local-type';
import { types } from '../types';

export const fieldsInCollection = async (collection: string) => {
	const [fields, columns] = await Promise.all([
		database.select('field').from('directus_fields').where({ collection }),
		schemaInspector.columns(collection),
	]);

	return uniq([...fields.map(({ field }) => field), ...columns.map(({ column }) => column)]);
};

/**
 * @TODO
 * update read to use ItemsService instead of direct to db
 */

export const readAll = async (collection?: string) => {
	const fieldsQuery = database.select('*').from('directus_fields');

	if (collection) {
		fieldsQuery.where({ collection });
	}

	const [columns, fields] = await Promise.all([
		schemaInspector.columnInfo(collection),
		fieldsQuery,
	]);

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
};

/** @todo add accountability */
export const readOne = async (
	collection: string,
	field: string,
	accountability?: Accountability
) => {
	let column;
	const fieldInfo = await database
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
};

export const createField = async (
	collection: string,
	field: Partial<Field> & { field: string; type: typeof types[number] },
	accountability: Accountability
) => {
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
		await ItemsService.createItem(
			'directus_fields',
			{
				...field.system,
				collection: collection,
				field: field.field,
			},
			accountability
		);
	}
};

/** @todo add update field */
/** @todo research how to make ^ happen in SQLite */

/** @todo save accountability */
export const deleteField = async (
	collection: string,
	field: string,
	accountability?: Accountability
) => {
	await database('directus_fields').delete().where({ collection, field });

	await database.schema.table(collection, (table) => {
		table.dropColumn(field);
	});
};
