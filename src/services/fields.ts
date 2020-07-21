import database, { schemaInspector } from '../database';
import { Field } from '../types/field';
import { uniq } from 'lodash';
import { Accountability } from '../types';
import * as ItemsService from '../services/items';

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
			database: column,
			system: field || null,
		};

		return data;
	});
};

export const readOne = async (collection: string, field: string) => {
	const [column, fieldInfo] = await Promise.all([
		schemaInspector.columnInfo(collection, field),
		database.select('*').from('directus_fields').where({ collection, field }).first(),
	]);

	const data = {
		collection: column.table,
		field: column.name,
		database: column,
		system: fieldInfo || null,
	};

	return data;
};

export const createField = async (
	collection: string,
	field: Partial<Field> & { field: string; database: { type: string } },
	accountability: Accountability
) => {
	await database.schema.alterTable(collection, (table) => {
		table.specificType(field.field, field.database.type);
		/** @todo add support for other database info (length etc) */
	});

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

	const createdField = await readOne(collection, field.field);
	return createdField;
};

/** @todo add update / delete field */
