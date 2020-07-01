import database, { schemaInspector } from '../database';

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

		/** @TODO
		 * return field defaults if field doesn't exist in directus_fields
		 */

		const data = {
			...column,
			...field,
			collection: column.table,
			field: column.name,
		};

		delete data.table;
		delete data.name;

		return data;
	});
};

export const readOne = async (collection: string, field: string) => {
	const [column, fieldInfo] = await Promise.all([
		schemaInspector.columnInfo(collection, field),
		database.select('*').from('directus_fields').where({ collection, field }).first(),
	]);

	/** @TODO
	 * return field defaults if field doesn't exist in directus_fields
	 */

	const data = {
		...column,
		...fieldInfo,
		collection: column.table,
		field: column.name,
	};

	delete data.table;
	delete data.name;

	return data;
};
