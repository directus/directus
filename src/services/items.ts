import database, { schemaInspector } from '../database';
import runAST from '../database/run-ast';
import getASTFromQuery from '../utils/get-ast-from-query';
import { Accountability, Operation, Item, Query, PrimaryKey } from '../types';
import Knex from 'knex';

import * as PayloadService from './payload';
import * as PermissionsService from './permissions';
import * as ActivityService from './activity';

import { pick, clone } from 'lodash';

async function saveActivityAndRevision(
	action: ActivityService.Action,
	collection: string,
	item: string,
	payload: Partial<Item>,
	accountability: Accountability,
	knex: Knex = database
) {
	const activityID = await knex('directus_activity')
		.insert({
			action,
			collection,
			item,
			ip: accountability.ip,
			user_agent: accountability.userAgent,
			action_by: accountability.user,
		})
		.returning('id');

	if (action !== ActivityService.Action.DELETE) {
		await knex('directus_revisions').insert({
			activity: activityID[0],
			collection,
			item,
			delta: payload,
			/** @todo make this configurable */
			data: await readItem(collection, item, { fields: ['*'] }),
			parent: accountability.parent,
		});
	}
}

export async function createItem<T extends Partial<Item> | Partial<Item>[]>(
	collection: string,
	data: T,
	accountability?: Accountability
): Promise<T extends Partial<Item>[] ? PrimaryKey[] : PrimaryKey> {
	const isBatch = Array.isArray(data);

	const primaryKeys = await database.transaction(async (transaction) => {
		let payloads = isBatch ? data : [data];

		const primaryKeys: PrimaryKey[] = await Promise.all(
			payloads.map(async (payload: Partial<Item>) => {
				if (accountability && accountability.admin === false) {
					payload = await PermissionsService.processValues(
						'create',
						collection,
						accountability?.role,
						payload
					);
				}

				payload = await PayloadService.processValues('create', collection, payload);

				payload = await PayloadService.processM2O(collection, payload);

				const primaryKeyField = await schemaInspector.primary(collection);
				// Only insert the values that actually save to an existing column. This ensures we ignore aliases etc
				const columns = await schemaInspector.columns(collection);
				const payloadWithoutAlias = pick(
					payload,
					columns.map(({ column }) => column)
				);

				const primaryKeys = await transaction(collection)
					.insert(payloadWithoutAlias)
					.returning(primaryKeyField);

				// This allows the o2m values to be populated correctly
				payload[primaryKeyField] = primaryKeys[0];

				await PayloadService.processO2M(collection, payload);

				if (accountability) {
					await saveActivityAndRevision(
						ActivityService.Action.CREATE,
						collection,
						primaryKeys[0],
						payloadWithoutAlias,
						accountability,
						transaction
					);
				}

				return primaryKeys[0] as PrimaryKey;
			})
		);

		return primaryKeys;
	});

	if (Array.isArray(data)) {
		return primaryKeys as T extends Partial<Record<string, any>>[] ? PrimaryKey[] : PrimaryKey;
	} else {
		return primaryKeys[0] as T extends Partial<Record<string, any>>[]
			? PrimaryKey[]
			: PrimaryKey;
	}
}

export const readItems = async <T = Partial<Item>>(
	collection: string,
	query: Query,
	accountability?: Accountability
): Promise<T[]> => {
	let ast = await getASTFromQuery(collection, query, accountability);

	if (accountability && accountability.admin === false) {
		ast = await PermissionsService.processAST(ast, accountability.role);
	}

	const records = await runAST(ast);
	return (await PayloadService.processValues('read', collection, records)) as T[];
};

export async function readItem<T extends PrimaryKey | PrimaryKey[]>(
	collection: string,
	primaryKey: T,
	query: Query,
	accountability?: Accountability,
	operation?: Operation
): Promise<T extends PrimaryKey ? Item : Item[]> {
	// We allow overriding the operation, so we can use the item read logic to validate permissions
	// for update and delete as well
	operation = operation || 'read';

	const primaryKeyField = await schemaInspector.primary(collection);
	const primaryKeys = (Array.isArray(primaryKey) ? primaryKey : [primaryKey]) as PrimaryKey[];
	const isBatch = Array.isArray(primaryKey);

	if (isBatch) {
		query = {
			...query,
			filter: {
				...(query.filter || {}),
				[primaryKeyField]: {
					_in: primaryKeys,
				},
			},
		};
	} else {
		query = {
			...query,
			filter: {
				...(query.filter || {}),
				[primaryKeyField]: {
					_eq: primaryKey,
				},
			},
		};
	}

	let ast = await getASTFromQuery(collection, query, accountability, operation);

	if (accountability && accountability.admin === false) {
		ast = await PermissionsService.processAST(ast, accountability.role, operation);
	}

	const records = await runAST(ast);
	const processedRecords = await PayloadService.processValues('read', collection, records);
	return isBatch ? processedRecords : processedRecords[0];
}

export async function updateItem<T extends PrimaryKey | PrimaryKey[]>(
	collection: string,
	primaryKey: T,
	data: Partial<Item>,
	accountability?: Accountability
): Promise<T> {
	const primaryKeys = (Array.isArray(primaryKey) ? primaryKey : [primaryKey]) as PrimaryKey[];

	await database.transaction(async (transaction) => {
		let payload = clone(data);

		return await Promise.all(
			primaryKeys.map(async (key) => {
				if (accountability && accountability.admin === false) {
					await PermissionsService.checkAccess(
						'update',
						collection,
						key,
						accountability.role
					);

					payload = await PermissionsService.processValues(
						'validate',
						collection,
						accountability.role,
						data
					);
				}

				payload = await PayloadService.processValues('update', collection, payload);
				payload = await PayloadService.processM2O(collection, payload);

				const primaryKeyField = await schemaInspector.primary(collection);

				// Only insert the values that actually save to an existing column. This ensures we ignore aliases etc
				const columns = await schemaInspector.columns(collection);

				const payloadWithoutAlias = pick(
					payload,
					columns.map(({ column }) => column)
				);

				await transaction(collection)
					.update(payloadWithoutAlias)
					.where({ [primaryKeyField]: key });

				if (accountability) {
					await saveActivityAndRevision(
						ActivityService.Action.UPDATE,
						collection,
						String(key),
						payloadWithoutAlias,
						accountability,
						transaction
					);
				}

				return primaryKey as PrimaryKey;
			})
		);
	});

	return primaryKey;
}

export const deleteItem = async <T extends number | string | (number | string)[]>(
	collection: string,
	pk: T,
	accountability?: Accountability
): Promise<T> => {
	const primaryKeyField = await schemaInspector.primary(collection);
	const primaryKeys: any[] = Array.isArray(pk) ? pk : [pk];

	await database.transaction(async (transaction) => {
		await Promise.all(
			primaryKeys.map(async (key) => {
				if (accountability && accountability.admin === false) {
					await PermissionsService.checkAccess(
						'delete',
						collection,
						key,
						accountability.role
					);
				}

				await transaction(collection)
					.where({ [primaryKeyField]: key })
					.delete();

				if (accountability) {
					await saveActivityAndRevision(
						ActivityService.Action.DELETE,
						collection,
						String(key),
						{},
						accountability,
						transaction
					);
				}
			})
		);
	});

	return pk;
};

export const readSingleton = async (
	collection: string,
	query: Query,
	accountability?: Accountability
) => {
	query.limit = 1;

	const records = await readItems(collection, query, accountability);
	const record = records[0];

	if (!record) {
		const columns = await schemaInspector.columnInfo(collection);
		const defaults: Record<string, any> = {};

		for (const column of columns) {
			defaults[column.name] = column.default_value;
		}

		return defaults;
	}

	return record;
};

export const upsertSingleton = async (
	collection: string,
	data: Partial<Item>,
	accountability: Accountability
) => {
	const primaryKeyField = await schemaInspector.primary(collection);
	const record = await database.select(primaryKeyField).from(collection).limit(1).first();

	if (record) {
		return await updateItem(collection, record.id, data, accountability);
	}

	return await createItem(collection, data, accountability);
};
