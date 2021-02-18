import database from '../database';
import runAST from '../database/run-ast';
import getASTFromQuery from '../utils/get-ast-from-query';
import {
	Action,
	Accountability,
	PermissionsAction,
	Item as AnyItem,
	Query,
	PrimaryKey,
	AbstractService,
	AbstractServiceOptions,
	SchemaOverview,
} from '../types';
import Knex from 'knex';
import cache from '../cache';
import emitter, { emitAsyncSafe } from '../emitter';
import { toArray } from '../utils/to-array';
import env from '../env';

import { PayloadService } from './payload';
import { AuthorizationService } from './authorization';

import { pick, clone, cloneDeep, merge } from 'lodash';
import getDefaultValue from '../utils/get-default-value';
import { InvalidPayloadException, ForbiddenException } from '../exceptions';

export class ItemsService<Item extends AnyItem = AnyItem> implements AbstractService {
	collection: string;
	knex: Knex;
	accountability: Accountability | null;
	eventScope: string;
	schema: SchemaOverview;

	constructor(collection: string, options: AbstractServiceOptions) {
		this.collection = collection;
		this.knex = options.knex || database;
		this.accountability = options.accountability || null;
		this.eventScope = this.collection.startsWith('directus_') ? this.collection.substring(9) : 'items';
		this.schema = options.schema;

		return this;
	}

	async create(data: Partial<Item>[]): Promise<PrimaryKey[]>;
	async create(data: Partial<Item>): Promise<PrimaryKey>;
	async create(data: Partial<Item> | Partial<Item>[]): Promise<PrimaryKey | PrimaryKey[]> {
		const primaryKeyField = this.schema.tables[this.collection].primary;
		const columns = Object.keys(this.schema.tables[this.collection].columns);

		let payloads: AnyItem[] = clone(toArray(data));

		const savedPrimaryKeys = await this.knex.transaction(async (trx) => {
			const payloadService = new PayloadService(this.collection, {
				accountability: this.accountability,
				knex: trx,
				schema: this.schema,
			});

			for (let i = 0; i < payloads.length; i++) {
				const customProcessed = await emitter.emitAsync(`${this.eventScope}.create.before`, payloads[i], {
					event: `${this.eventScope}.create.before`,
					accountability: this.accountability,
					collection: this.collection,
					item: null,
					action: 'create',
					payload: payloads[i],
					schema: this.schema,
				});

				if (customProcessed && customProcessed.length > 0) {
					payloads[i] = customProcessed.reverse().reduce((val, acc) => merge(acc, val));
				}
			}

			if (this.accountability) {
				const authorizationService = new AuthorizationService({
					accountability: this.accountability,
					knex: trx,
					schema: this.schema,
				});

				payloads = await authorizationService.validatePayload('create', this.collection, payloads);
			}

			payloads = await payloadService.processM2O(payloads);
			payloads = await payloadService.processA2O(payloads);

			let payloadsWithoutAliases = payloads.map((payload) => pick(payload, columns));

			payloadsWithoutAliases = await payloadService.processValues('create', payloadsWithoutAliases);

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
					user: this.accountability!.user,
					collection: this.collection,
					ip: this.accountability!.ip,
					user_agent: this.accountability!.userAgent,
					item: key,
				}));

				const activityPrimaryKeys: PrimaryKey[] = [];

				for (const activityRecord of activityRecords) {
					await trx.insert(activityRecord).into('directus_activity');

					let primaryKey;

					const result = await trx.select('id').from('directus_activity').orderBy('id', 'desc').first();

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

				if (revisionRecords.length > 0) {
					await trx.insert(revisionRecords).into('directus_revisions');
				}
			}

			if (cache && env.CACHE_AUTO_PURGE) {
				await cache.clear();
			}

			return primaryKeys;
		});

		emitAsyncSafe(`${this.eventScope}.create`, {
			event: `${this.eventScope}.create`,
			accountability: this.accountability,
			collection: this.collection,
			item: savedPrimaryKeys,
			action: 'create',
			payload: payloads,
			schema: this.schema,
		});

		return Array.isArray(data) ? savedPrimaryKeys : savedPrimaryKeys[0];
	}

	async readByQuery(
		query: Query,
		opts?: { stripNonRequested?: boolean }
	): Promise<null | Partial<Item> | Partial<Item>[]> {
		const authorizationService = new AuthorizationService({
			accountability: this.accountability,
			knex: this.knex,
			schema: this.schema,
		});

		let ast = await getASTFromQuery(this.collection, query, this.schema, {
			accountability: this.accountability,
			knex: this.knex,
		});

		if (this.accountability && this.accountability.admin !== true) {
			ast = await authorizationService.processAST(ast);
		}

		const records = await runAST(ast, this.schema, {
			knex: this.knex,
			stripNonRequested: opts?.stripNonRequested !== undefined ? opts.stripNonRequested : true,
		});
		return records as Partial<Item> | Partial<Item>[] | null;
	}

	readByKey(keys: PrimaryKey[], query?: Query, action?: PermissionsAction): Promise<null | Partial<Item>[]>;
	readByKey(key: PrimaryKey, query?: Query, action?: PermissionsAction): Promise<null | Partial<Item>>;
	async readByKey(
		key: PrimaryKey | PrimaryKey[],
		query: Query = {},
		action: PermissionsAction = 'read'
	): Promise<null | Partial<Item> | Partial<Item>[]> {
		query = clone(query);
		const primaryKeyField = this.schema.tables[this.collection].primary;
		const keys = toArray(key);

		if (keys.length === 1) {
			query.single = true;
		}

		const queryWithFilter = {
			...query,
			filter: {
				...(query.filter || {}),
				[primaryKeyField]: {
					_in: keys,
				},
			},
		};

		let ast = await getASTFromQuery(this.collection, queryWithFilter, this.schema, {
			accountability: this.accountability,
			action,
			knex: this.knex,
		});

		if (this.accountability && this.accountability.admin !== true) {
			const authorizationService = new AuthorizationService({
				accountability: this.accountability,
				knex: this.knex,
				schema: this.schema,
			});

			ast = await authorizationService.processAST(ast, action);
		}

		const result = await runAST(ast, this.schema, { knex: this.knex });

		if (result === null) throw new ForbiddenException();

		return result as Partial<Item> | Partial<Item>[] | null;
	}

	update(data: Partial<Item>, keys: PrimaryKey[]): Promise<PrimaryKey[]>;
	update(data: Partial<Item>, key: PrimaryKey): Promise<PrimaryKey>;
	update(data: Partial<Item>[]): Promise<PrimaryKey[]>;
	async update(
		data: Partial<Item> | Partial<Item>[],
		key?: PrimaryKey | PrimaryKey[]
	): Promise<PrimaryKey | PrimaryKey[]> {
		const primaryKeyField = this.schema.tables[this.collection].primary;
		const columns = Object.keys(this.schema.tables[this.collection].columns);

		// Updating one or more items to the same payload
		if (data && key) {
			const keys = toArray(key);

			let payload: Partial<AnyItem> | Partial<AnyItem>[] = clone(data);

			const customProcessed = await emitter.emitAsync(`${this.eventScope}.update.before`, payload, {
				event: `${this.eventScope}.update.before`,
				accountability: this.accountability,
				collection: this.collection,
				item: key,
				action: 'update',
				payload,
				schema: this.schema,
			});

			if (customProcessed && customProcessed.length > 0) {
				payload = customProcessed.reverse().reduce((val, acc) => merge(acc, val));
			}

			if (this.accountability) {
				const authorizationService = new AuthorizationService({
					accountability: this.accountability,
					knex: this.knex,
					schema: this.schema,
				});

				await authorizationService.checkAccess('update', this.collection, keys);

				payload = await authorizationService.validatePayload('update', this.collection, payload);
			}

			await this.knex.transaction(async (trx) => {
				const payloadService = new PayloadService(this.collection, {
					accountability: this.accountability,
					knex: trx,
					schema: this.schema,
				});

				payload = await payloadService.processM2O(payload);
				payload = await payloadService.processA2O(payload);

				let payloadWithoutAliases = pick(payload, columns);

				payloadWithoutAliases = await payloadService.processValues('update', payloadWithoutAliases);

				if (Object.keys(payloadWithoutAliases).length > 0) {
					await trx(this.collection).update(payloadWithoutAliases).whereIn(primaryKeyField, keys);
				}

				for (const key of keys) {
					await payloadService.processO2M(payload, key);
				}

				if (this.accountability) {
					const activityRecords = keys.map((key) => ({
						action: Action.UPDATE,
						user: this.accountability!.user,
						collection: this.collection,
						ip: this.accountability!.ip,
						user_agent: this.accountability!.userAgent,
						item: key,
					}));

					const activityPrimaryKeys: PrimaryKey[] = [];

					for (const activityRecord of activityRecords) {
						await trx.insert(activityRecord).into('directus_activity');
						let primaryKey;

						const result = await trx.select('id').from('directus_activity').orderBy('id', 'desc').first();

						primaryKey = result.id;
						activityPrimaryKeys.push(primaryKey);
					}

					const itemsService = new ItemsService(this.collection, {
						knex: trx,
						schema: this.schema,
					});
					const snapshots = await itemsService.readByKey(keys);

					const revisionRecords = activityPrimaryKeys.map((key, index) => ({
						activity: key,
						collection: this.collection,
						item: keys[index],
						data:
							snapshots && Array.isArray(snapshots) ? JSON.stringify(snapshots?.[index]) : JSON.stringify(snapshots),
						delta: JSON.stringify(payloadWithoutAliases),
					}));

					if (revisionRecords.length > 0) {
						await trx.insert(revisionRecords).into('directus_revisions');
					}
				}
			});

			if (cache && env.CACHE_AUTO_PURGE) {
				await cache.clear();
			}

			emitAsyncSafe(`${this.eventScope}.update`, {
				event: `${this.eventScope}.update`,
				accountability: this.accountability,
				collection: this.collection,
				item: key,
				action: 'update',
				payload,
				schema: this.schema,
			});

			return key;
		}

		const keys: PrimaryKey[] = [];

		await this.knex.transaction(async (trx) => {
			const itemsService = new ItemsService(this.collection, {
				accountability: this.accountability,
				knex: trx,
				schema: this.schema,
			});

			const payloads = toArray(data);

			for (const single of payloads as Partial<Item>[]) {
				const payload = clone(single);
				const key = payload[primaryKeyField];

				if (!key) {
					throw new InvalidPayloadException('Primary key is missing in update payload.');
				}

				keys.push(key);

				await itemsService.update(payload, key);
			}
		});

		return keys;
	}

	async updateByQuery(data: Partial<Item>, query: Query): Promise<PrimaryKey[]> {
		const primaryKeyField = this.schema.tables[this.collection].primary;
		const readQuery = cloneDeep(query);
		readQuery.fields = [primaryKeyField];

		// Not authenticated:
		const itemsService = new ItemsService(this.collection, {
			knex: this.knex,
			schema: this.schema,
		});

		let itemsToUpdate = await itemsService.readByQuery(readQuery);
		itemsToUpdate = toArray(itemsToUpdate);

		const keys: PrimaryKey[] = itemsToUpdate.map((item: Partial<Item>) => item[primaryKeyField]);

		return await this.update(data, keys);
	}

	upsert(data: Partial<Item>[]): Promise<PrimaryKey[]>;
	upsert(data: Partial<Item>): Promise<PrimaryKey>;
	async upsert(data: Partial<Item> | Partial<Item>[]): Promise<PrimaryKey | PrimaryKey[]> {
		const primaryKeyField = this.schema.tables[this.collection].primary;
		const payloads = toArray(data);
		const primaryKeys: PrimaryKey[] = [];

		for (const payload of payloads) {
			const primaryKey = payload[primaryKeyField];
			const exists =
				primaryKey &&
				!!(await this.knex
					.select(primaryKeyField)
					.from(this.collection)
					.where({ [primaryKeyField]: primaryKey })
					.first());

			if (exists) {
				const keys = await this.update([payload]);
				primaryKeys.push(...keys);
			} else {
				const key = await this.create(payload);
				primaryKeys.push(key);
			}
		}

		return Array.isArray(data) ? primaryKeys : primaryKeys[0];
	}

	delete(key: PrimaryKey): Promise<PrimaryKey>;
	delete(keys: PrimaryKey[]): Promise<PrimaryKey[]>;
	async delete(key: PrimaryKey | PrimaryKey[]): Promise<PrimaryKey | PrimaryKey[]> {
		const keys = toArray(key);
		const primaryKeyField = this.schema.tables[this.collection].primary;

		if (this.accountability && this.accountability.admin !== true) {
			const authorizationService = new AuthorizationService({
				accountability: this.accountability,
				schema: this.schema,
			});

			await authorizationService.checkAccess('delete', this.collection, key);
		}

		await emitter.emitAsync(`${this.eventScope}.delete.before`, {
			event: `${this.eventScope}.delete.before`,
			accountability: this.accountability,
			collection: this.collection,
			item: keys,
			action: 'delete',
			payload: null,
			schema: this.schema,
		});

		await this.knex.transaction(async (trx) => {
			await trx(this.collection).whereIn(primaryKeyField, keys).delete();

			if (this.accountability) {
				const activityRecords = keys.map((key) => ({
					action: Action.DELETE,
					user: this.accountability!.user,
					collection: this.collection,
					ip: this.accountability!.ip,
					user_agent: this.accountability!.userAgent,
					item: key,
				}));

				if (activityRecords.length > 0) {
					await trx.insert(activityRecords).into('directus_activity');
				}
			}
		});

		if (cache && env.CACHE_AUTO_PURGE) {
			await cache.clear();
		}

		emitAsyncSafe(`${this.eventScope}.delete`, {
			event: `${this.eventScope}.delete`,
			accountability: this.accountability,
			collection: this.collection,
			item: keys,
			action: 'delete',
			payload: null,
			schema: this.schema,
		});

		return key;
	}

	async deleteByQuery(query: Query): Promise<PrimaryKey[]> {
		const primaryKeyField = this.schema.tables[this.collection].primary;
		const readQuery = cloneDeep(query);
		readQuery.fields = [primaryKeyField];

		// Not authenticated:
		const itemsService = new ItemsService(this.collection, {
			knex: this.knex,
			schema: this.schema,
		});

		let itemsToDelete = await itemsService.readByQuery(readQuery);
		itemsToDelete = toArray(itemsToDelete);

		const keys: PrimaryKey[] = itemsToDelete.map((item: Partial<Item>) => item[primaryKeyField]);
		return await this.delete(keys);
	}

	async readSingleton(query: Query, opts?: { stripNonRequested?: boolean }): Promise<Partial<Item>> {
		query = clone(query);
		query.single = true;

		const record = (await this.readByQuery(query, opts)) as Partial<Item>;

		if (!record) {
			let columns = Object.values(this.schema.tables[this.collection].columns);
			const defaults: Record<string, any> = {};

			if (query.fields && query.fields.includes('*') === false) {
				columns = columns.filter((column) => {
					return query.fields!.includes(column.column_name);
				});
			}

			for (const column of columns) {
				defaults[column.column_name] = getDefaultValue(column);
			}

			return defaults as Partial<Item>;
		}

		return record;
	}

	async upsertSingleton(data: Partial<Item>) {
		const primaryKeyField = this.schema.tables[this.collection].primary;

		const record = await this.knex.select(primaryKeyField).from(this.collection).limit(1).first();

		if (record) {
			return await this.update(data, record.id);
		}

		return await this.create(data);
	}
}
