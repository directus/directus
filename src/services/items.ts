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
	const activityID = await knex('directus_activity').insert({
		action,
		collection,
		item,
		ip: accountability.ip,
		user_agent: accountability.userAgent,
		action_by: accountability.user,
	});

	if (action !== ActivityService.Action.DELETE) {
		await knex('directus_revisions').insert({
			activity: activityID[0],
			collection,
			item,
			delta: payload,
			/** @todo make this configurable */
			/** @todo this needs to support the same transaction as this function */
			// data: await readItem(collection, item, { fields: ['*'] }),
			parent: accountability.parent,
		});
	}

	return;
}

export async function createItem<T extends Partial<Item> | Partial<Item>[]>(
	collection: string,
	data: T,
	accountability?: Accountability
): Promise<T extends Partial<Item>[] ? PrimaryKey[] : PrimaryKey> {
	// Check permissions for all submitted payloads
	let payloads = clone(Array.isArray(data) ? data : [data]) as Record<string, any>[];

	const primaryKeyField = await schemaInspector.primary(collection);
	// Only insert the values that actually save to an existing column. This ensures we ignore aliases etc
	const columns = await schemaInspector.columns(collection);

	for (let i = 0; i < payloads.length; i++) {
		let payload = clone(payloads[i]);

		if (accountability && accountability.admin !== true) {
			payload = await PermissionsService.processValues(
				'create',
				collection,
				accountability?.role,
				payload
			);
		}

		payload = await PayloadService.processValues('create', collection, payload);
		payload = await PayloadService.processM2O(collection, payload);

		const payloadWithoutAlias = pick(
			payload,
			columns.map(({ column }) => column)
		);

		payloads[i] = payloadWithoutAlias;
	}

	const primaryKeys = await database.transaction(async (transaction) => {
		return await Promise.all(
			payloads.map(async (payload: Partial<Item>) => {
				const primaryKeys = await transaction(collection)
					.insert(payload)
					.returning(primaryKeyField);

				// This allows the o2m values to be populated correctly
				payload[primaryKeyField] = primaryKeys[0];

				/** @todo this needs transaction support too */
				await PayloadService.processO2M(collection, payload);

				if (accountability) {
					await saveActivityAndRevision(
						ActivityService.Action.CREATE,
						collection,
						primaryKeys[0],
						payload,
						accountability,
						transaction
					);
				}

				return primaryKeys[0] as PrimaryKey;
			})
		);
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

	query = query || {};

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

/**
 * Update one or more items to the given payload
 */
export async function updateItem<T extends PrimaryKey | PrimaryKey[]>(
	collection: string,
	primaryKey: T,
	data: Partial<Item>,
	accountability?: Accountability
): Promise<T> {
	const primaryKeys = (Array.isArray(primaryKey) ? primaryKey : [primaryKey]) as PrimaryKey[];

	let payload = clone(data);

	if (accountability?.admin !== true) {
		payload = await PermissionsService.processValues(
			'validate',
			collection,
			accountability?.role || null,
			payload
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

	// Make sure the user has access to every item they're trying to update
	await Promise.all(
		primaryKeys.map(async (key) => {
			if (accountability && accountability.admin === false) {
				return await PermissionsService.checkAccess(
					'update',
					collection,
					key,
					accountability.role
				);
			} else {
				return Promise.resolve();
			}
		})
	);

	// Save updates
	await database.transaction(async (transaction) => {
		for (const key of primaryKeys) {
			await transaction(collection)
				.where({ [primaryKeyField]: key })
				.update(payloadWithoutAlias);

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
		}

		return;
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
