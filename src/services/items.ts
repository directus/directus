import database from '../database';
import { Query } from '../types/query';

export const createItem = async (
	collection: string,
	data: Record<string, any>,
	query: Query = {}
) => {
	return await database(collection).insert(data);
};

export const readItems = async (collection: string, query: Query = {}) => {
	return await database.select(query?.fields || '*').from(collection);
};

export const readItem = async (collection: string, pk: number | string, query = {}) => {
	const records = await database.select('*').from(collection).where({ id: pk });
	return records[0];
};

export const updateItem = async (
	collection: string,
	pk: number | string,
	data: Record<string, any>,
	query: Query = {}
) => {
	return await database(collection).update(data).where({ id: pk });
};

export const deleteItem = async (collection: string, pk: number | string) => {
	return await database(collection).delete().where({ id: pk });
};
