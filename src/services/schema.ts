import database from '../database';

export const hasCollection = async (collection: string) => {
	return await database.schema.hasTable(collection);
};
