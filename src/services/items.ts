import database, { schemaInspector } from '../database';
import { Query } from '../types/query';

export const createItem = async (
	collection: string,
	data: Record<string, any>,
	query: Query = {}
) => {
	const primaryKeyField = await schemaInspector.primary(collection);
	const result = await database(collection).insert(data).returning(primaryKeyField);
	return readItem(collection, result[0], query);
};

export const readItems = async <T = Record<string, any>>(
	collection: string,
	query: Query = {}
): Promise<T[]> => {
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

export const readItem = async <T = any>(
	collection: string,
	pk: number | string,
	query: Query = {}
): Promise<T> => {
	const primaryKeyField = await schemaInspector.primary(collection);
	return await database
		.select('*')
		.from(collection)
		.where({ [primaryKeyField]: pk })
		.first();
};

export const updateItem = async (
	collection: string,
	pk: number | string,
	data: Record<string, any>,
	query: Query = {}
) => {
	const primaryKeyField = await schemaInspector.primary(collection);
	const result = await database(collection)
		.update(data)
		.where({ [primaryKeyField]: pk })
		.returning('id');
	return readItem(collection, result[0], query);
};

export const deleteItem = async (collection: string, pk: number | string) => {
	const primaryKeyField = await schemaInspector.primary(collection);
	return await database(collection)
		.delete()
		.where({ [primaryKeyField]: pk });
};
