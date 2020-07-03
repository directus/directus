import database, { schemaInspector } from '../database';
import { Query } from '../types/query';
import runAST from '../database/run-ast';
import getAST from '../utils/get-ast';

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
	const ast = await getAST(collection, query);
	const records = await runAST(ast);
	return records;
};

export const readItem = async <T = any>(
	collection: string,
	pk: number | string,
	query: Query = {}
): Promise<T> => {
	const primaryKeyField = await schemaInspector.primary(collection);

	query = {
		...query,
		filter: [
			...query.filter,
			{
				column: primaryKeyField,
				operator: 'eq',
				value: pk,
			},
		],
	};

	const ast = await getAST(collection, query);
	const records = await runAST(ast);
	return records[0];
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
