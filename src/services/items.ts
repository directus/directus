import database from '../database';
import { Query } from '../types/query';

export const createItem = async (
	collection: string,
	data: Record<string, any>,
	query: Query = {}
) => {
	await database(collection).insert(data);
};

export const readItems = async (collection: string, query: Query = {}) => {
	const dbQuery = database.select(query?.fields || '*').from(collection);

	if (query.sort) {
		dbQuery.orderBy(query.sort);
	}

	if (query.filter) {
		query.filter.forEach((filter) => {
			if (filter.operator === 'eq') {
				dbQuery.where({ [filter.column]: filter.value });
			}

			if (filter.operator === 'neq') {
				dbQuery.whereNot({ [filter.column]: filter.value });
			}

			if (filter.operator === 'null') {
				dbQuery.whereNull(filter.column);
			}

			if (filter.operator === 'nnull') {
				dbQuery.whereNotNull(filter.column);
			}
		});
	}

	if (query.limit && !query.offset) {
		dbQuery.limit(query.limit);
	}

	if (query.offset) {
		dbQuery.offset(query.offset);
	}

	if (query.page) {
		dbQuery.offset(query.limit * (query.page - 1));
	}

	if (query.single) {
		dbQuery.limit(1);
	}

	const records = await dbQuery;

	if (query.single) {
		return records[0];
	}

	return records;
};

export const readItem = async (collection: string, pk: number | string, query: Query = {}) => {
	const dbQuery = database.select('*').from(collection).where({ id: pk });

	const records = await dbQuery;

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
