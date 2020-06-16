import database from '../database';
import { Query } from '../types/query';

export const readAll = async (collection: string, query: Query = {}) => {
	return await database.select('*').from(collection);
};

export const create = async (collection: string, data: Record<string, any>, query: Query = {}) => {
	return await database(collection).insert(data);
};
