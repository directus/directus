import database from '../database';

export const hasCollection = async (collection: string) => {
	return await database.schema.hasTable(collection);
};

export const hasField = async (collection: string, field: string) => {
	return await database.schema.hasColumn(collection, field);
};

export const hasFields = async (collection: string, fields: string[]) => {
	const columns = await database(collection).columnInfo();
	const fieldNames = Object.keys(columns);
	return fields.map((fieldKey) => fieldNames.includes(fieldKey));
};
