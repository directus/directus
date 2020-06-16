import database from '../database';

export const hasCollection = async (collection: string) => {
	return await database.schema.hasTable(collection);
};

export const hasField = async (collection: string, field: string) => {
	return await database.schema.hasColumn(collection, field);
};
