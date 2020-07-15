import database, { schemaInspector } from '../database';
import { Query } from '../types/query';
import runAST from '../database/run-ast';
import getASTFromQuery from '../utils/get-ast-from-query';
import { Accountability, AST } from '../types';

import * as PayloadService from './payload';
import * as PermissionsService from './permissions';
import * as ActivityService from './activity';
import * as RevisionsService from './revisions';

import { pick } from 'lodash';
import logger from '../logger';

async function saveActivityAndRevision(
	action: ActivityService.Action,
	collection: string,
	item: string,
	payload: Record<string, any>,
	accountability: Accountability
) {
	const activityID = await ActivityService.createActivity({
		action,
		collection,
		item,
		ip: accountability.ip,
		user_agent: accountability.userAgent,
		action_by: accountability.user,
	});

	await RevisionsService.createRevision({
		activity: activityID,
		collection,
		item,
		delta: payload,
		/** @todo make this configurable */
		data: await readItem(collection, item, { fields: ['*'] }),
		parent: accountability.parent,
	});
}

export const createItem = async (
	collection: string,
	data: Record<string, any>,
	accountability?: Accountability
): Promise<string | number> => {
	let payload = data;

	if (accountability) {
		payload = await PermissionsService.processValues(
			'create',
			collection,
			accountability?.role,
			data
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

	const primaryKeys = await database(collection)
		.insert(payloadWithoutAlias)
		.returning(primaryKeyField);

	// This allows the o2m values to be populated correctly
	payload[primaryKeyField] = primaryKeys[0];

	await PayloadService.processO2M(collection, payload);

	if (accountability) {
		// Don't await this. It can run async in the background
		saveActivityAndRevision(
			ActivityService.Action.CREATE,
			collection,
			primaryKeys[0],
			payloadWithoutAlias,
			accountability
		).catch((err) => logger.error(err));
	}

	return primaryKeys[0];
};

export const readItems = async <T = Record<string, any>>(
	collection: string,
	query: Query,
	accountability?: Accountability
): Promise<T[]> => {
	let ast = await getASTFromQuery(collection, query, accountability?.role);

	if (accountability) {
		ast = await PermissionsService.processAST(ast, accountability.role);
	}

	const records = await runAST(ast);
	return await PayloadService.processValues('read', collection, records);
};

export const readItem = async <T = any>(
	collection: string,
	pk: number | string,
	query: Query = {},
	accountability?: Accountability
): Promise<T> => {
	const primaryKeyField = await schemaInspector.primary(collection);

	query = {
		...query,
		filter: {
			...(query.filter || {}),
			[primaryKeyField]: {
				_eq: pk,
			},
		},
	};

	let ast = await getASTFromQuery(collection, query, accountability?.role);

	if (accountability) {
		ast = await PermissionsService.processAST(ast, accountability.role);
	}

	const records = await runAST(ast);
	return await PayloadService.processValues('read', collection, records[0]);
};

export const updateItem = async (
	collection: string,
	pk: number | string,
	data: Record<string, any>,
	accountability?: Accountability
): Promise<string | number> => {
	let payload = data;

	if (accountability) {
		payload = await PermissionsService.processValues(
			'validate',
			collection,
			accountability?.role,
			data
		);
	}

	payload = await PayloadService.processValues('update', collection, data);

	payload = await PayloadService.processM2O(collection, payload);

	const primaryKeyField = await schemaInspector.primary(collection);

	// Only insert the values that actually save to an existing column. This ensures we ignore aliases etc
	const columns = await schemaInspector.columns(collection);

	const payloadWithoutAlias = pick(
		payload,
		columns.map(({ column }) => column)
	);

	await database(collection)
		.update(payloadWithoutAlias)
		.where({ [primaryKeyField]: pk });

	if (accountability) {
		// Don't await this. It can run async in the background
		saveActivityAndRevision(
			ActivityService.Action.UPDATE,
			collection,
			String(pk),
			payloadWithoutAlias,
			accountability
		).catch((err) => logger.error(err));
	}

	return pk;
};

export const deleteItem = async (
	collection: string,
	pk: number | string,
	accountability?: Accountability
) => {
	const primaryKeyField = await schemaInspector.primary(collection);

	if (accountability) {
		// Don't await this. It can run async in the background
		saveActivityAndRevision(
			ActivityService.Action.DELETE,
			collection,
			String(pk),
			{},
			accountability
		).catch((err) => logger.error(err));
	}

	return await database(collection)
		.delete()
		.where({ [primaryKeyField]: pk });
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
		const defaults = {};

		for (const column of columns) {
			defaults[column.name] = column.default_value;
		}

		return defaults;
	}

	return record;
};

export const upsertSingleton = async (
	collection: string,
	data: Record<string, any>,
	accountability: Accountability
) => {
	const primaryKeyField = await schemaInspector.primary(collection);
	const record = await database.select(primaryKeyField).from(collection).limit(1).first();

	if (record) {
		return await updateItem(collection, record.id, data, accountability);
	}

	return await createItem(collection, data, accountability);
};
