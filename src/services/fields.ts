import database, { schemaInspector } from '../database';
import { Field } from '../types/field';

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

export const createField = async (collection: string, field: Partial<Field>) => {
	await database.schema.alterTable('articles', (table) => {
		table.specificType(field.field, field.database.type);
		/** @todo add support for other database info (length etc) */
	});

	if (field.system) {
		await database('directus_fields').insert({
			...field.system,
			collection: collection,
			field: field.field,
		});
	}

	const createdField = await readOne(collection, field.field);
	return createdField;
};
