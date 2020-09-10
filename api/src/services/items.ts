import database from '../database';
import SchemaInspector from 'knex-schema-inspector';
import runAST from '../database/run-ast';
import getASTFromQuery from '../utils/get-ast-from-query';
import {
	Action,
	Accountability,
	PermissionsAction,
	Item,
	Query,
	PrimaryKey,
	AbstractService,
	AbstractServiceOptions,
} from '../types';
import Knex from 'knex';
import cache from '../cache';
import emitter from '../emitter';

import PayloadService from './payload';
import AuthorizationService from './authorization';

import { pick, clone } from 'lodash';
import getDefaultValue from '../utils/get-default-value';
import { InvalidPayloadException } from '../exceptions';

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
		const schemaInspector = SchemaInspector(this.knex);
		const primaryKeyField = await schemaInspector.primary(this.collection);
		const columns = await schemaInspector.columns(this.collection);

		let payloads = clone(Array.isArray(data) ? data : [data]);

		const savedPrimaryKeys = await this.knex.transaction(async (trx) => {
			const payloadService = new PayloadService(this.collection, {
				accountability: this.accountability,
				knex: trx,
			});

			const authorizationService = new AuthorizationService({
				accountability: this.accountability,
				knex: trx,
			});

			payloads = await payloadService.processM2O(payloads);

			let payloadsWithoutAliases = payloads.map((payload) =>
				pick(
					payload,
					columns.map(({ column }) => column)
				)
			);

			payloadsWithoutAliases = await payloadService.processValues(
				'create',
				payloadsWithoutAliases
			);

			if (this.accountability && this.accountability.admin !== true) {
				payloads = await authorizationService.validatePayload(
					'create',
					this.collection,
					payloads
				);
			}

			const primaryKeys: PrimaryKey[] = [];

			for (const payloadWithoutAlias of payloadsWithoutAliases) {
				// string / uuid primary
				let primaryKey = payloadWithoutAlias[primaryKeyField];

				await trx.insert(payloadWithoutAlias).into(this.collection);

				// Auto-incremented id
				if (!primaryKey) {
					const result = await trx
						.select(primaryKeyField)
						.from(this.collection)
						.orderBy(primaryKeyField, 'desc')
						.first();
					primaryKey = result[primaryKeyField];
				}

				primaryKeys.push(primaryKey);
			}

			payloads = payloads.map((payload, index) => {
				payload[primaryKeyField] = primaryKeys[index];
				return payload;
			});

			for (const key of primaryKeys) {
				await payloadService.processO2M(payloads, key);
			}

			if (this.accountability) {
				const activityRecords = primaryKeys.map((key) => ({
					action: Action.CREATE,
					action_by: this.accountability!.user,
					collection: this.collection,
					ip: this.accountability!.ip,
					user_agent: this.accountability!.userAgent,
					item: key,
				}));

				const activityPrimaryKeys: PrimaryKey[] = [];

				for (const activityRecord of activityRecords) {
					await trx.insert(activityRecord).into('directus_activity');

					let primaryKey;

					const result = await trx
						.select('id')
						.from('directus_activity')
						.orderBy('id', 'desc')
						.first();

					primaryKey = result.id;

					activityPrimaryKeys.push(primaryKey);
				}

				const revisionRecords = activityPrimaryKeys.map((key, index) => ({
					activity: key,
					collection: this.collection,
					item: primaryKeys[index],
					data: JSON.stringify(payloads[index]),
					delta: JSON.stringify(payloads[index]),
				}));

				await trx.insert(revisionRecords).into('directus_revisions');
			}

			if (cache) {
				await cache.clear();
			}

			emitter.emitAsync(`item.create.${this.collection}`, {
				collection: this.collection,
				item: primaryKeys,
				action: 'create',
				payload: payloads,
			});

			return primaryKeys;
		});

		return Array.isArray(data) ? savedPrimaryKeys : savedPrimaryKeys[0];
	}

	async readByQuery(query: Query): Promise<Item[]> {
		const authorizationService = new AuthorizationService({
			accountability: this.accountability,
		});
		let ast = await getASTFromQuery(this.collection, query, this.accountability);

		if (this.accountability && this.accountability.admin === false) {
			ast = await authorizationService.processAST(ast);
		}

		const records = await runAST(ast);

		return records;
	}

	readByKey(keys: PrimaryKey[], query?: Query, action?: PermissionsAction): Promise<Item[]>;
	readByKey(key: PrimaryKey, query?: Query, action?: PermissionsAction): Promise<Item>;
	async readByKey(
		key: PrimaryKey | PrimaryKey[],
		query: Query = {},
		action: PermissionsAction = 'read'
	): Promise<Item | Item[]> {
		query = clone(query);
		const schemaInspector = SchemaInspector(this.knex);
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
			action
		);

		if (this.accountability && this.accountability.admin !== true) {
			const authorizationService = new AuthorizationService({
				accountability: this.accountability,
			});
			ast = await authorizationService.processAST(ast, action);
		}

		const records = await runAST(ast);
		return Array.isArray(key) ? records : records[0];
	}

	update(data: Partial<Item>, keys: PrimaryKey[]): Promise<PrimaryKey[]>;
	update(data: Partial<Item>, key: PrimaryKey): Promise<PrimaryKey>;
	update(data: Partial<Item>[]): Promise<PrimaryKey[]>;
	async update(
		data: Partial<Item> | Partial<Item>[],
		key?: PrimaryKey | PrimaryKey[]
	): Promise<PrimaryKey | PrimaryKey[]> {
		const schemaInspector = SchemaInspector(this.knex);
		const primaryKeyField = await schemaInspector.primary(this.collection);
		const columns = await schemaInspector.columns(this.collection);

		// Updating one or more items to the same payload
		if (data && key) {
			const keys = Array.isArray(key) ? key : [key];

			let payload = clone(data);

			if (this.accountability && this.accountability.admin !== true) {
				const authorizationService = new AuthorizationService({
					accountability: this.accountability,
				});
				await authorizationService.checkAccess('update', this.collection, keys);
				payload = await authorizationService.validatePayload(
					'update',
					this.collection,
					payload
				);
			}

			await this.knex.transaction(async (trx) => {
				const payloadService = new PayloadService(this.collection, {
					accountability: this.accountability,
					knex: trx,
				});

				payload = await payloadService.processM2O(payload);

				let payloadWithoutAliases = pick(
					payload,
					columns.map(({ column }) => column)
				);

				payloadWithoutAliases = await payloadService.processValues(
					'update',
					payloadWithoutAliases
				);

				if (Object.keys(payloadWithoutAliases).length > 0) {
					await trx(this.collection)
						.update(payloadWithoutAliases)
						.whereIn(primaryKeyField, keys);
				}

				for (const key of keys) {
					await payloadService.processO2M(payload, key);
				}

				if (this.accountability) {
					const activityRecords = keys.map((key) => ({
						action: Action.UPDATE,
						action_by: this.accountability!.user,
						collection: this.collection,
						ip: this.accountability!.ip,
						user_agent: this.accountability!.userAgent,
						item: key,
					}));

					const activityPrimaryKeys: PrimaryKey[] = [];

					for (const activityRecord of activityRecords) {
						await trx.insert(activityRecord).into('directus_activity');
						let primaryKey;
						const result = await trx
							.select('id')
							.from('directus_activity')
							.orderBy('id', 'desc')
							.first();
						primaryKey = result.id;
						activityPrimaryKeys.push(primaryKey);
					}

					const itemsService = new ItemsService(this.collection, { knex: trx });

					const snapshots = await itemsService.readByKey(keys);

					const revisionRecords = activityPrimaryKeys.map((key, index) => ({
						activity: key,
						collection: this.collection,
						item: keys[index],
						data: JSON.stringify(snapshots[index]),
						delta: JSON.stringify(payloadWithoutAliases),
					}));

					await trx.insert(revisionRecords).into('directus_revisions');
				}
			});

			if (cache) {
				await cache.clear();
			}

			emitter.emitAsync(`item.update.${this.collection}`, {
				collection: this.collection,
				item: key,
				action: 'update',
				payload,
			});

			return key;
		}

		const keys: PrimaryKey[] = [];

		await this.knex.transaction(async (trx) => {
			const itemsService = new ItemsService(this.collection, {
				accountability: this.accountability,
				knex: trx,
			});

			const payloads = Array.isArray(data) ? data : [data];

			for (const single of payloads as Partial<Item>[]) {
				let payload = clone(single);
				const key = payload[primaryKeyField];
				if (!key)
					throw new InvalidPayloadException('Primary key is missing in update payload.');
				keys.push(key);
				await itemsService.update(payload, key);
			}
		});

		return keys;
	}

	delete(key: PrimaryKey): Promise<PrimaryKey>;
	delete(keys: PrimaryKey[]): Promise<PrimaryKey[]>;
	async delete(key: PrimaryKey | PrimaryKey[]): Promise<PrimaryKey | PrimaryKey[]> {
		const keys = (Array.isArray(key) ? key : [key]) as PrimaryKey[];
		const schemaInspector = SchemaInspector(this.knex);
		const primaryKeyField = await schemaInspector.primary(this.collection);

		if (this.accountability && this.accountability.admin !== true) {
			const authorizationService = new AuthorizationService({
				accountability: this.accountability,
			});

			await authorizationService.checkAccess('delete', this.collection, key);
		}

		await this.knex.transaction(async (trx) => {
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

		if (cache) {
			await cache.clear();
		}

		emitter.emitAsync(`item.delete.${this.collection}`, {
			collection: this.collection,
			item: key,
			action: 'delete',
		});

		return key;
	}

	async readSingleton(query: Query) {
		query = clone(query);
		const schemaInspector = SchemaInspector(this.knex);
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
		const schemaInspector = SchemaInspector(this.knex);
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
