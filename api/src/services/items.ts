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
import { Knex } from 'knex';
import cache from '../cache';
import emitter, { emitAsyncSafe } from '../emitter';
import { toArray } from '../utils/to-array';
import env from '../env';

import { PayloadService } from './payload';
import { AuthorizationService } from './authorization';

import { pick, clone, cloneDeep, merge, without } from 'lodash';
import { translateDatabaseError } from '../exceptions/database/translate';
import { InvalidPayloadException, ForbiddenException } from '../exceptions';

import logger from '../logger';

export type QueryOptions = {
	stripNonRequested?: boolean;
	permissionsAction?: PermissionsAction;
};

export type MutationOptions = {
	/**
	 * Callback function that's fired whenever a revision is made in the mutation
	 */
	onRevisionCreate?: (id: number) => void;

	/**
	 * Flag to disable the auto purging of the cache. Is ignored when CACHE_AUTO_PURGE isn't enabled.
	 */
	autoPurgeCache?: false;

	/**
	 * Allow disabling the emitting of hooks. Useful if a custom hook is fired (like files.upload)
	 */
	emitEvents?: boolean;
};

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

	/**
	 * Create a single new item.
	 */
	async createOne(data: Partial<Item>, opts?: MutationOptions): Promise<PrimaryKey> {
		const primaryKeyField = this.schema.collections[this.collection].primary;
		const fields = Object.keys(this.schema.collections[this.collection].fields);
		const aliases = Object.values(this.schema.collections[this.collection].fields)
			.filter((field) => field.alias === true)
			.map((field) => field.field);

		let payload: AnyItem = cloneDeep(data);

		// By wrapping the logic in a transaction, we make sure we automatically roll back all the
		// changes in the DB if any of the parts contained within throws an error. This also means
		// that any errors thrown in any nested relational changes will bubble up and cancel the whole
		// update tree
		const primaryKey: PrimaryKey = await this.knex.transaction(async (trx) => {
			// We're creating new services instances so they can use the transaction as their Knex interface
			const payloadService = new PayloadService(this.collection, {
				accountability: this.accountability,
				knex: trx,
				schema: this.schema,
			});

			const authorizationService = new AuthorizationService({
				accountability: this.accountability,
				knex: trx,
				schema: this.schema,
			});

			// Run all hooks that are attached to this event so the end user has the chance to augment the
			// item that is about to be saved
			const hooksResult =
				opts?.emitEvents !== false
					? (
							await emitter.emitAsync(`${this.eventScope}.create.before`, payload, {
								event: `${this.eventScope}.create.before`,
								accountability: this.accountability,
								collection: this.collection,
								item: null,
								action: 'create',
								payload,
								schema: this.schema,
								database: trx,
							})
					  ).filter((val) => val)
					: [];

			// The events are fired last-to-first based on when they were created. By reversing the
			// output array of results, we ensure that the augmentations are applied in
			// "chronological" order
			const payloadAfterHooks =
				hooksResult.length > 0 ? hooksResult.reverse().reduce((val, acc) => merge(acc, val)) : payload;

			const payloadWithPresets = this.accountability
				? await authorizationService.validatePayload('create', this.collection, payloadAfterHooks)
				: payloadAfterHooks;

			const { payload: payloadWithM2O, revisions: revisionsM2O } = await payloadService.processM2O(payloadWithPresets);
			const { payload: payloadWithA2O, revisions: revisionsA2O } = await payloadService.processA2O(payloadWithM2O);

			const payloadWithoutAliases = pick(payloadWithA2O, without(fields, ...aliases));
			const payloadWithTypeCasting = await payloadService.processValues('create', payloadWithoutAliases);

			// In case of manual string / UUID primary keys, they PK already exists in the object we're saving.
			let primaryKey = payloadWithTypeCasting[primaryKeyField];

			try {
				await trx.insert(payloadWithoutAliases).into(this.collection);
			} catch (err) {
				throw await translateDatabaseError(err);
			}

			// When relying on a database auto-incremented ID, we'll have to fetch it from the DB in
			// order to know what the PK is of the just-inserted item
			if (!primaryKey) {
				// Fetching it with max should be safe, as we're in the context of the current transaction
				const result = await trx.max(primaryKeyField, { as: 'id' }).from(this.collection).first();
				primaryKey = result.id;
				// Set the primary key on the input item, in order for the "after" event hook to be able
				// to read from it
				payload[primaryKeyField] = primaryKey;
			}

			const { revisions: revisionsO2M } = await payloadService.processO2M(payload, primaryKey);

			// If this is an authenticated action, and accountability tracking is enabled, save activity row
			if (this.accountability && this.schema.collections[this.collection].accountability !== null) {
				const activityRecord = {
					action: Action.CREATE,
					user: this.accountability!.user,
					collection: this.collection,
					ip: this.accountability!.ip,
					user_agent: this.accountability!.userAgent,
					item: primaryKey,
				};

				await trx.insert(activityRecord).into('directus_activity');

				const { id: activityID } = await trx.max('id', { as: 'id ' }).from('directus_activity').first();

				// If revisions are tracked, create revisions record
				if (this.schema.collections[this.collection].accountability === 'all') {
					const revisionRecord = {
						activity: activityID,
						collection: this.collection,
						item: primaryKey,
						data: JSON.stringify(payload),
						delta: JSON.stringify(payload),
					};

					await trx.insert(revisionRecord).into('directus_revisions');

					const { id: revisionID } = await trx.max('id', { as: 'id' }).from('directus_revisions').first();

					// Make sure to set the parent field of the child-revision rows
					const childrenRevisions = [...revisionsM2O, ...revisionsA2O, ...revisionsO2M];

					if (childrenRevisions.length > 0) {
						await trx('directus_revisions').update({ parent: revisionID }).whereIn('id', childrenRevisions);
					}

					if (opts?.onRevisionCreate) {
						opts.onRevisionCreate(revisionID);
					}
				}
			}

			return primaryKey;
		});

		if (opts?.emitEvents !== false) {
			emitAsyncSafe(`${this.eventScope}.create`, {
				event: `${this.eventScope}.create`,
				accountability: this.accountability,
				collection: this.collection,
				item: primaryKey,
				action: 'create',
				payload,
				schema: this.schema,
				database: this.knex,
			});
		}

		if (cache && env.CACHE_AUTO_PURGE && opts?.autoPurgeCache !== false) {
			await cache.clear();
		}

		return primaryKey;
	}

	/**
	 * Create multiple new items at once. Inserts all provided records sequentially wrapped in a transaction.
	 */
	async createMany(data: Partial<Item>[], opts?: MutationOptions): Promise<PrimaryKey[]> {
		const primaryKeys = await this.knex.transaction(async (trx) => {
			const service = new ItemsService(this.collection, {
				accountability: this.accountability,
				schema: this.schema,
				knex: trx,
			});

			const primaryKeys: PrimaryKey[] = [];

			for (const payload of data) {
				const primaryKey = await service.createOne(payload, { autoPurgeCache: false });
				primaryKeys.push(primaryKey);
			}

			return primaryKeys;
		});

		if (cache && env.CACHE_AUTO_PURGE && opts?.autoPurgeCache !== false) {
			await cache.clear();
		}

		return primaryKeys;
	}

	/**
	 * Get items by query
	 */
	async readByQuery(query: Query, opts?: QueryOptions): Promise<Item[]> {
		const authorizationService = new AuthorizationService({
			accountability: this.accountability,
			knex: this.knex,
			schema: this.schema,
		});

		let ast = await getASTFromQuery(this.collection, query, this.schema, {
			accountability: this.accountability,
			// By setting the permissions action, you can read items using the permissions for another
			// operation's permissions. This is used to dynamically check if you have update/delete
			// access to (a) certain item(s)
			action: opts?.permissionsAction || 'read',
			knex: this.knex,
		});

		if (this.accountability && this.accountability.admin !== true) {
			ast = await authorizationService.processAST(ast, opts?.permissionsAction);
		}

		const records = await runAST(ast, this.schema, {
			knex: this.knex,
			// GraphQL requires relational keys to be returned regardless
			stripNonRequested: opts?.stripNonRequested !== undefined ? opts.stripNonRequested : true,
		});

		if (records === null) {
			throw new ForbiddenException();
		}

		return records as Item[];
	}

	/**
	 * Get single item by primary key
	 */
	async readOne(key: PrimaryKey, query?: Query, opts?: QueryOptions): Promise<Item> {
		query = query ?? {};

		const primaryKeyField = this.schema.collections[this.collection].primary;

		const queryWithKey = {
			...query,
			filter: {
				...(query.filter || {}),
				[primaryKeyField]: {
					_eq: key,
				},
			},
		};

		const results = await this.readByQuery(queryWithKey, opts);

		if (results.length === 0) {
			throw new ForbiddenException();
		}

		return results[0];
	}

	/**
	 * Get multiple items by primary keys
	 */
	async readMany(keys: PrimaryKey[], query?: Query, opts?: QueryOptions): Promise<Item[]> {
		query = query ?? {};

		const primaryKeyField = this.schema.collections[this.collection].primary;

		const queryWithKeys = {
			...query,
			filter: {
				_and: [
					query.filter || {},
					{
						[primaryKeyField]: {
							_in: keys,
						},
					},
				],
			},
		};

		const results = await this.readByQuery(queryWithKeys, opts);
		return results;
	}

	/**
	 * Update multiple items by query
	 */
	async updateByQuery(query: Query, data: Partial<Item>, opts?: MutationOptions): Promise<PrimaryKey[]> {
		const primaryKeyField = this.schema.collections[this.collection].primary;
		const readQuery = cloneDeep(query);
		readQuery.fields = [primaryKeyField];

		// Not authenticated:
		const itemsService = new ItemsService(this.collection, {
			knex: this.knex,
			schema: this.schema,
		});

		// We read the IDs of the items based on the query, and then run `updateMany`. `updateMany` does it's own
		// permissions check for the keys, so we don't have to make this an authenticated read
		const itemsToUpdate = await itemsService.readByQuery(readQuery);
		const keys: PrimaryKey[] = itemsToUpdate.map((item: AnyItem) => item[primaryKeyField]).filter((pk) => pk);

		return await this.updateMany(keys, data, opts);
	}

	/**
	 * Update a single item by primary key
	 */
	async updateOne(key: PrimaryKey, data: Partial<Item>, opts?: MutationOptions): Promise<PrimaryKey> {
		await this.updateMany([key], data, opts);
		return key;
	}

	/**
	 * Update many items by query
	 */
	async updateMany(keys: PrimaryKey[], data: Partial<Item>, opts?: MutationOptions): Promise<PrimaryKey[]> {
		const primaryKeyField = this.schema.collections[this.collection].primary;
		const fields = Object.keys(this.schema.collections[this.collection].fields);
		const aliases = Object.values(this.schema.collections[this.collection].fields)
			.filter((field) => field.alias === true)
			.map((field) => field.field);

		const payload: Partial<AnyItem> = cloneDeep(data);

		const authorizationService = new AuthorizationService({
			accountability: this.accountability,
			knex: this.knex,
			schema: this.schema,
		});

		// Run all hooks that are attached to this event so the end user has the chance to augment the
		// item that is about to be saved
		const hooksResult =
			opts?.emitEvents !== false
				? (
						await emitter.emitAsync(`${this.eventScope}.update.before`, payload, {
							event: `${this.eventScope}.update.before`,
							accountability: this.accountability,
							collection: this.collection,
							item: keys,
							action: 'update',
							payload,
							schema: this.schema,
							database: this.knex,
						})
				  ).filter((val) => val)
				: [];

		// The events are fired last-to-first based on when they were created. By reversing the
		// output array of results, we ensure that the augmentations are applied in
		// "chronological" order
		const payloadAfterHooks =
			hooksResult.length > 0 ? hooksResult.reverse().reduce((val, acc) => merge(acc, val)) : payload;

		if (this.accountability) {
			await authorizationService.checkAccess('update', this.collection, keys);
		}

		const payloadWithPresets = this.accountability
			? await authorizationService.validatePayload('update', this.collection, payloadAfterHooks)
			: payloadAfterHooks;

		await this.knex.transaction(async (trx) => {
			const payloadService = new PayloadService(this.collection, {
				accountability: this.accountability,
				knex: trx,
				schema: this.schema,
			});

			const { payload: payloadWithM2O, revisions: revisionsM2O } = await payloadService.processM2O(payloadWithPresets);
			const { payload: payloadWithA2O, revisions: revisionsA2O } = await payloadService.processA2O(payloadWithM2O);

			const payloadWithoutAliasAndPK = pick(payloadWithA2O, without(fields, primaryKeyField, ...aliases));
			const payloadWithTypeCasting = await payloadService.processValues('update', payloadWithoutAliasAndPK);

			if (Object.keys(payloadWithTypeCasting).length > 0) {
				try {
					await trx(this.collection).update(payloadWithTypeCasting).whereIn(primaryKeyField, keys);
				} catch (err) {
					throw await translateDatabaseError(err);
				}
			}

			const childrenRevisions = [...revisionsM2O, ...revisionsA2O];

			for (const key of keys) {
				const { revisions } = await payloadService.processO2M(payload, key);
				childrenRevisions.push(...revisions);
			}

			// If this is an authenticated action, and accountability tracking is enabled, save activity row
			if (this.accountability && this.schema.collections[this.collection].accountability !== null) {
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

					const result = await trx.max('id', { as: 'id' }).from('directus_activity').first();
					primaryKey = result.id;

					activityPrimaryKeys.push(primaryKey);
				}

				if (this.schema.collections[this.collection].accountability === 'all') {
					const itemsService = new ItemsService(this.collection, {
						knex: trx,
						schema: this.schema,
					});

					const snapshots = await itemsService.readMany(keys);

					const revisionRecords = activityPrimaryKeys.map((key, index) => ({
						activity: key,
						collection: this.collection,
						item: keys[index],
						data:
							snapshots && Array.isArray(snapshots) ? JSON.stringify(snapshots?.[index]) : JSON.stringify(snapshots),
						delta: JSON.stringify(payloadWithTypeCasting),
					}));

					for (let i = 0; i < revisionRecords.length; i++) {
						await trx.insert(revisionRecords[i]).into('directus_revisions');
						const { id: revisionID } = await trx.max('id', { as: 'id' }).from('directus_revisions').first();

						if (opts?.onRevisionCreate) {
							opts.onRevisionCreate(revisionID);
						}

						if (i === 0) {
							// In case of a nested relational creation/update in a updateMany, the nested m2o/a2o
							// creation is only done once. We treat the first updated item as the "main" update,
							// with all other revisions on the current level as regular "flat" updates, and
							// nested revisions as children of this first "root" item.
							if (childrenRevisions.length > 0) {
								await trx('directus_revisions').update({ parent: revisionID }).whereIn('id', childrenRevisions);
							}
						}
					}
				}
			}
		});

		if (cache && env.CACHE_AUTO_PURGE && opts?.autoPurgeCache !== false) {
			await cache.clear();
		}

		if (opts?.emitEvents !== false) {
			emitAsyncSafe(`${this.eventScope}.update`, {
				event: `${this.eventScope}.update`,
				accountability: this.accountability,
				collection: this.collection,
				item: keys,
				action: 'update',
				payload,
				schema: this.schema,
				database: this.knex,
			});
		}

		return keys;
	}

	/**
	 * Upsert a single item
	 */
	async upsertOne(payload: Partial<Item>, opts?: MutationOptions) {
		const primaryKeyField = this.schema.collections[this.collection].primary;
		const primaryKey: PrimaryKey | undefined = payload[primaryKeyField];

		const exists =
			primaryKey &&
			!!(await this.knex
				.select(primaryKeyField)
				.from(this.collection)
				.where({ [primaryKeyField]: primaryKey })
				.first());

		if (exists) {
			return await this.updateOne(primaryKey as PrimaryKey, payload, opts);
		} else {
			return await this.createOne(payload, opts);
		}
	}

	/**
	 * Upsert many items
	 */
	async upsertMany(payloads: Partial<Item>[], opts?: MutationOptions) {
		const primaryKeys = await this.knex.transaction(async (trx) => {
			const service = new ItemsService(this.collection, {
				accountability: this.accountability,
				schema: this.schema,
				knex: trx,
			});

			const primaryKeys: PrimaryKey[] = [];

			for (const payload of payloads) {
				const primaryKey = await service.upsertOne(payload, { autoPurgeCache: false });
				primaryKeys.push(primaryKey);
			}

			return primaryKeys;
		});

		if (cache && env.CACHE_AUTO_PURGE && opts?.autoPurgeCache !== false) {
			await cache.clear();
		}

		return primaryKeys;
	}

	/**
	 * Delete multiple items by query
	 */
	async deleteByQuery(query: Query): Promise<PrimaryKey[]> {
		const primaryKeyField = this.schema.collections[this.collection].primary;
		const readQuery = cloneDeep(query);
		readQuery.fields = [primaryKeyField];

		// Not authenticated:
		const itemsService = new ItemsService(this.collection, {
			knex: this.knex,
			schema: this.schema,
		});

		const itemsToDelete = await itemsService.readByQuery(readQuery);
		const keys: PrimaryKey[] = itemsToDelete.map((item: AnyItem) => item[primaryKeyField]);
		return await this.deleteMany(keys);
	}

	/**
	 * Delete a single item by primary key
	 */
	async deleteOne(key: PrimaryKey, opts?: MutationOptions): Promise<PrimaryKey> {
		await this.deleteMany([key], opts);
		return key;
	}

	/**
	 * Delete multiple items by primary key
	 */
	async deleteMany(keys: PrimaryKey[], opts?: MutationOptions): Promise<PrimaryKey[]> {
		const primaryKeyField = this.schema.collections[this.collection].primary;

		if (this.accountability && this.accountability.admin !== true) {
			const authorizationService = new AuthorizationService({
				accountability: this.accountability,
				schema: this.schema,
			});

			await authorizationService.checkAccess('delete', this.collection, keys);
		}

		if (opts?.emitEvents !== false) {
			await emitter.emitAsync(`${this.eventScope}.delete.before`, {
				event: `${this.eventScope}.delete.before`,
				accountability: this.accountability,
				collection: this.collection,
				item: keys,
				action: 'delete',
				payload: null,
				schema: this.schema,
				database: this.knex,
			});
		}

		await this.knex.transaction(async (trx) => {
			await trx(this.collection).whereIn(primaryKeyField, keys).delete();

			if (this.accountability && this.schema.collections[this.collection].accountability !== null) {
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

		if (cache && env.CACHE_AUTO_PURGE && opts?.autoPurgeCache !== false) {
			await cache.clear();
		}

		if (opts?.emitEvents !== false) {
			emitAsyncSafe(`${this.eventScope}.delete`, {
				event: `${this.eventScope}.delete`,
				accountability: this.accountability,
				collection: this.collection,
				item: keys,
				action: 'delete',
				payload: null,
				schema: this.schema,
				database: this.knex,
			});
		}

		return keys;
	}

	/**
	 * Read/treat collection as singleton
	 */
	async readSingleton(query: Query, opts?: QueryOptions): Promise<Partial<Item>> {
		query = clone(query);

		query.limit = 1;

		const records = await this.readByQuery(query, opts);
		const record = records[0];

		if (!record) {
			let fields = Object.entries(this.schema.collections[this.collection].fields);
			const defaults: Record<string, any> = {};

			if (query.fields && query.fields.includes('*') === false) {
				fields = fields.filter(([name]) => {
					return query.fields!.includes(name);
				});
			}

			for (const [name, field] of fields) {
				defaults[name] = field.defaultValue;
			}

			return defaults as Partial<Item>;
		}

		return record;
	}

	/**
	 * Upsert/treat collection as singleton
	 */
	async upsertSingleton(data: Partial<Item>, opts?: MutationOptions) {
		const primaryKeyField = this.schema.collections[this.collection].primary;
		const record = await this.knex.select(primaryKeyField).from(this.collection).limit(1).first();

		if (record) {
			return await this.updateOne(record[primaryKeyField], data, opts);
		}

		return await this.createOne(data, opts);
	}

	/**
	 * @deprecated Use createOne or createMany instead
	 */
	async create(data: Partial<Item>[], opts?: MutationOptions): Promise<PrimaryKey[]>;
	async create(data: Partial<Item>, opts?: MutationOptions): Promise<PrimaryKey>;
	async create(data: Partial<Item> | Partial<Item>[], opts?: MutationOptions): Promise<PrimaryKey | PrimaryKey[]> {
		logger.warn(
			'ItemsService.create is deprecated and will be removed before v9.0.0. Use createOne or createMany instead.'
		);

		if (Array.isArray(data)) return this.createMany(data, opts);
		return this.createOne(data, opts);
	}

	/**
	 * @deprecated Use `readOne` or `readMany` instead
	 */
	readByKey(keys: PrimaryKey[], query?: Query, action?: PermissionsAction): Promise<null | Partial<Item>[]>;
	readByKey(key: PrimaryKey, query?: Query, action?: PermissionsAction): Promise<null | Partial<Item>>;
	async readByKey(
		key: PrimaryKey | PrimaryKey[],
		query: Query = {},
		action: PermissionsAction = 'read'
	): Promise<null | Partial<Item> | Partial<Item>[]> {
		logger.warn(
			'ItemsService.readByKey is deprecated and will be removed before v9.0.0. Use readOne or readMany instead.'
		);

		if (Array.isArray(key)) {
			return this.readMany(key, query, { permissionsAction: action });
		} else {
			return this.readOne(key, query, { permissionsAction: action });
		}
	}

	/**
	 * @deprecated Use `updateOne` or `updateMany` instead
	 */
	update(data: Partial<Item>, keys: PrimaryKey[]): Promise<PrimaryKey[]>;
	update(data: Partial<Item>, key: PrimaryKey): Promise<PrimaryKey>;
	update(data: Partial<Item>[]): Promise<PrimaryKey[]>;
	async update(
		data: Partial<Item> | Partial<Item>[],
		key?: PrimaryKey | PrimaryKey[]
	): Promise<PrimaryKey | PrimaryKey[]> {
		logger.warn(
			'ItemsService.update is deprecated and will be removed before v9.0.0. Use updateOne or updateMany instead.'
		);

		const primaryKeyField = this.schema.collections[this.collection].primary;

		if (key) {
			data = Array.isArray(data) ? data[0] : data;
			if (Array.isArray(key)) return await this.updateMany(key, data);
			else return await this.updateOne(key, data);
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

				await itemsService.updateOne(key, payload);
			}
		});

		return keys;
	}

	/**
	 * @deprecated Use `upsertOne` or `upsertMany` instead
	 */
	upsert(data: Partial<Item>[]): Promise<PrimaryKey[]>;
	upsert(data: Partial<Item>): Promise<PrimaryKey>;
	async upsert(data: Partial<Item> | Partial<Item>[]): Promise<PrimaryKey | PrimaryKey[]> {
		logger.warn(
			'ItemsService.upsert is deprecated and will be removed before v9.0.0. Use upsertOne or upsertMany instead.'
		);

		if (Array.isArray(data)) return await this.upsertMany(data);
		return await this.upsertOne(data);
	}

	/**
	 * @deprecated Use `deleteOne` or `deleteMany` instead
	 */
	delete(key: PrimaryKey): Promise<PrimaryKey>;
	delete(keys: PrimaryKey[]): Promise<PrimaryKey[]>;
	async delete(key: PrimaryKey | PrimaryKey[]): Promise<PrimaryKey | PrimaryKey[]> {
		logger.warn(
			'ItemsService.delete is deprecated and will be removed before v9.0.0. Use deleteOne or deleteMany instead.'
		);

		if (Array.isArray(key)) return await this.deleteMany(key);
		else return await this.deleteOne(key);
	}
}
