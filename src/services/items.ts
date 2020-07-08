import database, { schemaInspector } from '../database';
import { Query } from '../types/query';
import runAST from '../database/run-ast';
import getAST from '../utils/get-ast';
import * as PayloadService from './payload';
import { pick } from 'lodash';

export const createItem = async (collection: string, data: Record<string, any>) => {
	let payload = await PayloadService.processValues('create', collection, data);

	payload = await PayloadService.processM2O(collection, payload);

	const primaryKeyField = await schemaInspector.primary(collection);

	// Only insert the values that actually save to an existing column. This ensures we ignore aliases etc
	const columns = await schemaInspector.columns(collection);
	const primaryKeys = await database(collection)
		.insert(
			pick(
				payload,
				columns.map(({ column }) => column)
			)
		)
		.returning(primaryKeyField);

	// This allows the o2m values to be populated correctly
	payload[primaryKeyField] = primaryKeys[0];

	await PayloadService.processO2M(collection, payload);

	return primaryKeys[0];
};

export const readItems = async <T = Record<string, any>>(
	collection: string,
	query: Query = {}
): Promise<T[]> => {
	const ast = await getAST(collection, query);
	const records = await runAST(ast);
	return await PayloadService.processValues('read', collection, records);
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
			...(query.filter || []),
			{
				column: primaryKeyField,
				operator: 'eq',
				value: pk,
			},
		],
	};

	const ast = await getAST(collection, query);
	const records = await runAST(ast);
	return await PayloadService.processValues('read', collection, records[0]);
};

export const updateItem = async (
	collection: string,
	pk: number | string,
	data: Record<string, any>
) => {
	let payload = await PayloadService.processValues('create', collection, data);

	payload = await PayloadService.processM2O(collection, payload);

	const primaryKeyField = await schemaInspector.primary(collection);

	// Only insert the values that actually save to an existing column. This ensures we ignore aliases etc
	const columns = await schemaInspector.columns(collection);
	const primaryKeys = await database(collection)
		.update(
			pick(
				payload,
				columns.map(({ column }) => column)
			)
		)
		.where({ [primaryKeyField]: pk })
		.returning(primaryKeyField);

	return primaryKeys[0];
};

export const deleteItem = async (collection: string, pk: number | string) => {
	const primaryKeyField = await schemaInspector.primary(collection);
	return await database(collection)
		.delete()
		.where({ [primaryKeyField]: pk });
};
