import database, { schemaInspector } from '../database';
import runAST from '../database/run-ast';
import getASTFromQuery from '../utils/get-ast-from-query';
import {
	Action,
	Accountability,
	Operation,
	Item,
	Query,
	PrimaryKey,
	AbstractService,
	AbstractServiceOptions,
} from '../types';
import Knex from 'knex';

import PayloadService from './payload';
import AuthorizationService from './authorization';

import { pick, clone } from 'lodash';
import getDefaultValue from '../utils/get-default-value';

export default class ItemsService implements AbstractService {
	collection: string;
	knex: Knex;
	accountability: Accountability | null;

	constructor(collection: string, options?: AbstractServiceOptions) {
		this.collection = collection;
		this.knex = options?.knex || database;
		this.accountability = options?.accountability || null;

		return this;
	}

	async create(data: Partial<Item>[]): Promise<PrimaryKey[]>;
	async create(data: Partial<Item>): Promise<PrimaryKey>;
	async create(data: Partial<Item> | Partial<Item>[]): Promise<PrimaryKey | PrimaryKey[]> {
		const primaryKeyField = await schemaInspector.primary(this.collection);
		const columns = await schemaInspector.columns(this.collection);

		let payloads = clone(Array.isArray(data) ? data : [data]);

		const savedPrimaryKeys = await this.knex.transaction(async (trx) => {
			const payloadService = new PayloadService(this.collection, { knex: trx });
			const authorizationService = new AuthorizationService({ knex: trx });

			payloads = await payloadService.processValues('create', payloads);
			payloads = await payloadService.processM2O(payloads);

			const payloadsWithoutAliases = payloads.map((payload) =>
				pick(
					payload,
					columns.map(({ column }) => column)
				)
			);

			if (this.accountability && this.accountability.admin !== true) {
				payloads = await authorizationService.processValues(
					'create',
					this.collection,
					payloads
				);
			}

			const primaryKeys = await trx.insert(payloadsWithoutAliases).into(this.collection);

			if (this.accountability) {
				const activityRecords = primaryKeys.map((key) => ({
					action: Action.CREATE,
					action_by: this.accountability!.user,
					collection: this.collection,
					ip: this.accountability!.ip,
					user_agent: this.accountability!.userAgent,
					item: key,
				}));

				await trx.insert(activityRecords).into('directus_activity');
			}

			payloads = payloads.map((payload, index) => {
				payload[primaryKeyField] = primaryKeys[index];
				return payload;
			});

			await payloadService.processO2M(payloads);

			return primaryKeys;
		});

		return Array.isArray(data) ? savedPrimaryKeys : savedPrimaryKeys[0];
	}

	async readByQuery(query: Query): Promise<Item[]> {
		const payloadService = new PayloadService(this.collection);
		const authorizationService = new AuthorizationService({
			accountability: this.accountability,
		});
		let ast = await getASTFromQuery(this.collection, query, this.accountability);

		if (this.accountability && this.accountability.admin === false) {
			ast = await authorizationService.processAST(ast);
		}

		const records = await runAST(ast);
		const processedRecords = await payloadService.processValues('read', records);
		return processedRecords;
	}

	readByKey(keys: PrimaryKey[], query?: Query, operation?: Operation): Promise<Item[]>;
	readByKey(key: PrimaryKey, query?: Query, operation?: Operation): Promise<Item>;
	async readByKey(
		key: PrimaryKey | PrimaryKey[],
		query: Query = {},
		operation: Operation = 'read'
	): Promise<Item | Item[]> {
		const payloadService = new PayloadService(this.collection);
		const primaryKeyField = await schemaInspector.primary(this.collection);
		const keys = Array.isArray(key) ? key : [key];

		const queryWithFilter = {
			...query,
			filter: {
				...(query.filter || {}),
				[primaryKeyField]: {
					_in: keys,
				},
			},
		};

		let ast = await getASTFromQuery(
			this.collection,
			queryWithFilter,
			this.accountability,
			operation
		);

		if (this.accountability && this.accountability.admin !== true) {
			const authorizationService = new AuthorizationService({
				accountability: this.accountability,
			});
			ast = await authorizationService.processAST(ast, operation);
		}

		const records = await runAST(ast);
		const processedRecords = await payloadService.processValues('read', records);

		return Array.isArray(key) ? processedRecords : processedRecords[0];
	}

	update(data: Partial<Item>, keys: PrimaryKey[]): Promise<PrimaryKey[]>;
	update(data: Partial<Item>, key: PrimaryKey): Promise<PrimaryKey>;
	update(data: Partial<Item>[]): Promise<PrimaryKey[]>;
	async update(
		data: Partial<Item> | Partial<Item>[],
		key?: PrimaryKey | PrimaryKey[]
	): Promise<PrimaryKey | PrimaryKey[]> {
		return 15; /** nothing to see here 👀 */

		// // /**
		// //  * Update one or more items to the given payload
		// //  */
		// export async function updateItem<T extends PrimaryKey | PrimaryKey[]>(
		// 	collection: string,
		// 	primaryKey: T,
		// 	data: Partial<Item>,
		// 	accountability?: Accountability
		// ): Promise<T> {
		// 	const primaryKeys = (Array.isArray(primaryKey) ? primaryKey : [primaryKey]) as PrimaryKey[];

		// 	let payload = clone(data);

		// 	if (accountability?.admin !== true) {
		// 		payload = await PermissionsService.processValues(
		// 			'validate',
		// 			collection,
		// 			accountability?.role || null,
		// 			payload
		// 		);
		// 	}

		// 	payload = await PayloadService.processValues('update', collection, payload);
		// 	payload = await PayloadService.processM2O(collection, payload);

		// 	const primaryKeyField = await schemaInspector.primary(collection);

		// 	// Only insert the values that actually save to an existing column. This ensures we ignore aliases etc
		// 	const columns = await schemaInspector.columns(collection);

		// 	const payloadWithoutAlias = pick(
		// 		payload,
		// 		columns.map(({ column }) => column)
		// 	);

		// 	// Make sure the user has access to every item they're trying to update
		// 	await Promise.all(
		// 		primaryKeys.map(async (key) => {
		// 			if (accountability && accountability.admin === false) {
		// 				return await PermissionsService.checkAccess(
		// 					'update',
		// 					collection,
		// 					key,
		// 					accountability.role
		// 				);
		// 			} else {
		// 				return Promise.resolve();
		// 			}
		// 		})
		// 	);

		// 	// Save updates
		// 	await database.transaction(async (transaction) => {
		// 		for (const key of primaryKeys) {
		// 			await transaction(collection)
		// 				.where({ [primaryKeyField]: key })
		// 				.update(payloadWithoutAlias);

		// 			if (accountability) {
		// 				await saveActivityAndRevision(
		// 					ActivityService.Action.UPDATE,
		// 					collection,
		// 					String(key),
		// 					payloadWithoutAlias,
		// 					accountability,
		// 					transaction
		// 				);
		// 			}
		// 		}

		// 		return;
		// 	});

		// 	return primaryKey;
		// }
	}

	delete(key: PrimaryKey): Promise<PrimaryKey>;
	delete(keys: PrimaryKey[]): Promise<PrimaryKey[]>;
	async delete(key: PrimaryKey | PrimaryKey[]): Promise<PrimaryKey | PrimaryKey[]> {
		const keys = (Array.isArray(key) ? key : [key]) as PrimaryKey[];
		const primaryKeyField = await schemaInspector.primary(this.collection);

		if (this.accountability && this.accountability.admin !== false) {
			const authorizationService = new AuthorizationService({
				accountability: this.accountability,
			});

			await authorizationService.checkAccess('delete', this.collection, key);
		}

		await database.transaction(async (trx) => {
			await trx(this.collection).whereIn(primaryKeyField, keys).delete();

			if (this.accountability) {
				const activityRecords = keys.map((key) => ({
					action: Action.DELETE,
					action_by: this.accountability!.user,
					collection: this.collection,
					ip: this.accountability!.ip,
					user_agent: this.accountability!.userAgent,
					item: key,
				}));

				await trx.insert(activityRecords).into('directus_activity');
			}
		});

		return key;
	}

	async readSingleton(query: Query) {
		query.limit = 1;

		const records = await this.readByQuery(query);
		const record = records[0];

		if (!record) {
			const columns = await schemaInspector.columnInfo(this.collection);
			const defaults: Record<string, any> = {};

			for (const column of columns) {
				defaults[column.name] = getDefaultValue(column);
			}

			return defaults;
		}

		return record;
	}

	async upsertSingleton(data: Partial<Item>) {
		const primaryKeyField = await schemaInspector.primary(this.collection);

		const record = await this.knex
			.select(primaryKeyField)
			.from(this.collection)
			.limit(1)
			.first();

		if (record) {
			return await this.update(data, record.id);
		}

		return await this.create(data);
	}
}
