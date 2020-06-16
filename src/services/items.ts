import database from '../database';
import { Query } from '../types/query';

export const create = async (collection: string, data: Record<string, any>, query: Query = {}) => {
	await database(collection).insert(data);
};
