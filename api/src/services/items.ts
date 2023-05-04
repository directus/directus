import type { Accountability, PermissionsAction, Query, SchemaOverview } from '@directus/types';
import { Action } from '@directus/constants';
import type Keyv from 'keyv';
import type { Knex } from 'knex';
import { assign, clone, cloneDeep, omit, pick, without } from 'lodash-es';
import { getCache } from '../cache.js';
import { getHelpers } from '../database/helpers/index.js';
import getDatabase from '../database/index.js';
import runAST from '../database/run-ast.js';
import emitter from '../emitter.js';
import env from '../env.js';
import { translateDatabaseError } from '../exceptions/database/translate.js';
import { ForbiddenException, InvalidPayloadException } from '../exceptions/index.js';
import type {
	AbstractService,
	AbstractServiceOptions,
	ActionEventParams,
	Item as AnyItem,
	MutationOptions,
	PrimaryKey,
} from '../types/index.js';
import getASTFromQuery from '../utils/get-ast-from-query.js';
import { validateKeys } from '../utils/validate-keys.js';
import { AuthorizationService } from './authorization.js';
import { PayloadService } from './payload.js';

export type QueryOptions = {
	stripNonRequested?: boolean;
	permissionsAction?: PermissionsAction;
	emitEvents?: boolean;
};

export type MutationTracker = {
	trackMutations: (count: number) => void;
	getCount: () => number;
};

export class ItemsService<Item extends AnyItem = AnyItem> implements AbstractService {
	collection: string;
	knex: Knex;
	accountability: Accountability | null;
	eventScope: string;
	schema: SchemaOverview;
	cache: Keyv<any> | null;

	constructor(collection: string, options: AbstractServiceOptions) {
		this.collection = collection;
		this.knex = options.knex || getDatabase();
		this.accountability = options.accountability || null;
		this.eventScope = this.collection.startsWith('directus_') ? this.collection.substring(9) : 'items';
		this.schema = options.schema;
		this.cache = getCache().cache;

		return this;
	}

	createMutationTracker(initialCount = 0): MutationTracker {
		const maxCount = Number(env['MAX_BATCH_MUTATION']);
		let mutationCount = initialCount;
		return {
			trackMutations(count: number) {
				mutationCount += count;

				if (mutationCount > maxCount) {
					throw new InvalidPayloadException(`Exceeded max batch mutation limit of ${maxCount}.`);
				}
			},
			getCount() {
				return mutationCount;
			},
		};
	}

	async getKeysByQuery(query: Query): Promise<PrimaryKey[]> {
		const primaryKeyField = this.schema.collections[this.collection]!.primary;
		const readQuery = cloneDeep(query);
		readQuery.fields = [primaryKeyField];

		// Allow unauthenticated access
		const itemsService = new ItemsService(this.collection, {
			knex: this.knex,
			schema: this.schema,
		});

		// We read the IDs of the items based on the query, and then run `updateMany`. `updateMany` does it's own
		// permissions check for the keys, so we don't have to make this an authenticated read
		const items = await itemsService.readByQuery(readQuery);
		return items.map((item: AnyItem) => item[primaryKeyField]).filter((pk) => pk);
	}

	/**
	 * Create a single new item.
	 */
	async createOne(data: Partial<Item>, opts: MutationOptions = {}): Promise<PrimaryKey> {
		if (!opts.mutationTracker) opts.mutationTracker = this.createMutationTracker();

		if (!opts.bypassLimits) {
			opts.mutationTracker.trackMutations(1);
		}

		const { ActivityService } = await import('./activity.js');
		const { RevisionsService } = await import('./revisions.js');

		const primaryKeyField = this.schema.collections[this.collection]!.primary;
		const fields = Object.keys(this.schema.collections[this.collection]!.fields);

		const aliases = Object.values(this.schema.collections[this.collection]!.fields)
			.filter((field) => field.alias === true)
			.map((field) => field.field);

		const payload: AnyItem = cloneDeep(data);
		const nestedActionEvents: ActionEventParams[] = [];

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
			const payloadAfterHooks =
				opts.emitEvents !== false
					? await emitter.emitFilter(
							this.eventScope === 'items'
								? ['items.create', `${this.collection}.items.create`]
								: `${this.eventScope}.create`,
							payload,
							{
								collection: this.collection,
							},
							{
								database: trx,
								schema: this.schema,
								accountability: this.accountability,
							}
					  )
					: payload;

			const payloadWithPresets = this.accountability
				? authorizationService.validatePayload('create', this.collection, payloadAfterHooks)
				: payloadAfterHooks;

			if (opts.preMutationException) {
				throw opts.preMutationException;
			}

			const {
				payload: payloadWithM2O,
				revisions: revisionsM2O,
				nestedActionEvents: nestedActionEventsM2O,
			} = await payloadService.processM2O(payloadWithPresets, opts);

			const {
				payload: payloadWithA2O,
				revisions: revisionsA2O,
				nestedActionEvents: nestedActionEventsA2O,
			} = await payloadService.processA2O(payloadWithM2O, opts);

			const payloadWithoutAliases = pick(payloadWithA2O, without(fields, ...aliases));
			const payloadWithTypeCasting = await payloadService.processValues('create', payloadWithoutAliases);

			// In case of manual string / UUID primary keys, the PK already exists in the object we're saving.
			let primaryKey = payloadWithTypeCasting[primaryKeyField];

			try {
				const result = await trx
					.insert(payloadWithoutAliases)
					.into(this.collection)
					.returning(primaryKeyField)
					.then((result) => result[0]);

				const returnedKey = typeof result === 'object' ? result[primaryKeyField] : result;

				if (this.schema.collections[this.collection]!.fields[primaryKeyField]!.type === 'uuid') {
					primaryKey = getHelpers(trx).schema.formatUUID(primaryKey ?? returnedKey);
				} else {
					primaryKey = primaryKey ?? returnedKey;
				}
			} catch (err: any) {
				throw await translateDatabaseError(err);
			}

			// Most database support returning, those who don't tend to return the PK anyways
			// (MySQL/SQLite). In case the primary key isn't know yet, we'll do a best-attempt at
			// fetching it based on the last inserted row
			if (!primaryKey) {
				// Fetching it with max should be safe, as we're in the context of the current transaction
				const result = await trx.max(primaryKeyField, { as: 'id' }).from(this.collection).first();
				primaryKey = result.id;
				// Set the primary key on the input item, in order for the "after" event hook to be able
				// to read from it
				payload[primaryKeyField] = primaryKey;
			}

			const { revisions: revisionsO2M, nestedActionEvents: nestedActionEventsO2M } = await payloadService.processO2M(
				payloadWithPresets,
				primaryKey,
				opts
			);

			nestedActionEvents.push(...nestedActionEventsM2O);
			nestedActionEvents.push(...nestedActionEventsA2O);
			nestedActionEvents.push(...nestedActionEventsO2M);

			// If this is an authenticated action, and accountability tracking is enabled, save activity row
			if (this.accountability && this.schema.collections[this.collection]!.accountability !== null) {
				const activityService = new ActivityService({
					knex: trx,
					schema: this.schema,
				});

				const activity = await activityService.createOne({
					action: Action.CREATE,
					user: this.accountability!.user,
					collection: this.collection,
					ip: this.accountability!.ip,
					user_agent: this.accountability!.userAgent,
					origin: this.accountability!.origin,
					item: primaryKey,
				});

				// If revisions are tracked, create revisions record
				if (this.schema.collections[this.collection]!.accountability === 'all') {
					const revisionsService = new RevisionsService({
						knex: trx,
						schema: this.schema,
					});

					const revisionDelta = await payloadService.prepareDelta(payloadAfterHooks);

					const revision = await revisionsService.createOne({
						activity: activity,
						collection: this.collection,
						item: primaryKey,
						data: revisionDelta,
						delta: revisionDelta,
					});

					// Make sure to set the parent field of the child-revision rows
					const childrenRevisions = [...revisionsM2O, ...revisionsA2O, ...revisionsO2M];

					if (childrenRevisions.length > 0) {
						await revisionsService.updateMany(childrenRevisions, { parent: revision }, { bypassLimits: true });
					}

					if (opts.onRevisionCreate) {
						opts.onRevisionCreate(revision);
					}
				}
			}

			return primaryKey;
		});

		if (opts.emitEvents !== false) {
			const actionEvent = {
				event:
					this.eventScope === 'items'
						? ['items.create', `${this.collection}.items.create`]
						: `${this.eventScope}.create`,
				meta: {
					payload,
					key: primaryKey,
					collection: this.collection,
				},
				context: {
					database: getDatabase(),
					schema: this.schema,
					accountability: this.accountability,
				},
			};

			if (opts.bypassEmitAction) {
				opts.bypassEmitAction(actionEvent);
			} else {
				emitter.emitAction(actionEvent.event, actionEvent.meta, actionEvent.context);
			}

			for (const nestedActionEvent of nestedActionEvents) {
				if (opts.bypassEmitAction) {
					opts.bypassEmitAction(nestedActionEvent);
				} else {
					emitter.emitAction(nestedActionEvent.event, nestedActionEvent.meta, nestedActionEvent.context);
				}
			}
		}

		if (this.cache && env['CACHE_AUTO_PURGE'] && opts.autoPurgeCache !== false) {
			await this.cache.clear();
		}

		return primaryKey;
	}

	/**
	 * Create multiple new items at once. Inserts all provided records sequentially wrapped in a transaction.
	 */
	async createMany(data: Partial<Item>[], opts: MutationOptions = {}): Promise<PrimaryKey[]> {
		if (!opts.mutationTracker) opts.mutationTracker = this.createMutationTracker();

		const { primaryKeys, nestedActionEvents } = await this.knex.transaction(async (trx) => {
			const service = new ItemsService(this.collection, {
				accountability: this.accountability,
				schema: this.schema,
				knex: trx,
			});

			const primaryKeys: PrimaryKey[] = [];
			const nestedActionEvents: ActionEventParams[] = [];

			for (const payload of data) {
				const primaryKey = await service.createOne(payload, {
					...(opts || {}),
					autoPurgeCache: false,
					bypassEmitAction: (params) => nestedActionEvents.push(params),
					mutationTracker: opts.mutationTracker,
				});

				primaryKeys.push(primaryKey);
			}

			return { primaryKeys, nestedActionEvents };
		});

		if (opts.emitEvents !== false) {
			for (const nestedActionEvent of nestedActionEvents) {
				if (opts.bypassEmitAction) {
					opts.bypassEmitAction(nestedActionEvent);
				} else {
					emitter.emitAction(nestedActionEvent.event, nestedActionEvent.meta, nestedActionEvent.context);
				}
			}
		}

		if (this.cache && env['CACHE_AUTO_PURGE'] && opts.autoPurgeCache !== false) {
			await this.cache.clear();
		}

		return primaryKeys;
	}

	/**
	 * Get items by query
	 */
	async readByQuery(query: Query, opts?: QueryOptions): Promise<Item[]> {
		const updatedQuery =
			opts?.emitEvents !== false
				? await emitter.emitFilter(
						this.eventScope === 'items'
							? ['items.query', `${this.collection}.items.query`]
							: `${this.eventScope}.query`,
						query,
						{
							collection: this.collection,
						},
						{
							database: this.knex,
							schema: this.schema,
							accountability: this.accountability,
						}
				  )
				: query;

		let ast = await getASTFromQuery(this.collection, updatedQuery, this.schema, {
			accountability: this.accountability,
			// By setting the permissions action, you can read items using the permissions for another
			// operation's permissions. This is used to dynamically check if you have update/delete
			// access to (a) certain item(s)
			action: opts?.permissionsAction || 'read',
			knex: this.knex,
		});

		if (this.accountability && this.accountability.admin !== true) {
			const authorizationService = new AuthorizationService({
				accountability: this.accountability,
				knex: this.knex,
				schema: this.schema,
			});

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

		const filteredRecords =
			opts?.emitEvents !== false
				? await emitter.emitFilter(
						this.eventScope === 'items' ? ['items.read', `${this.collection}.items.read`] : `${this.eventScope}.read`,
						records,
						{
							query: updatedQuery,
							collection: this.collection,
						},
						{
							database: this.knex,
							schema: this.schema,
							accountability: this.accountability,
						}
				  )
				: records;

		if (opts?.emitEvents !== false) {
			emitter.emitAction(
				this.eventScope === 'items' ? ['items.read', `${this.collection}.items.read`] : `${this.eventScope}.read`,
				{
					payload: filteredRecords,
					query: updatedQuery,
					collection: this.collection,
				},
				{
					database: this.knex || getDatabase(),
					schema: this.schema,
					accountability: this.accountability,
				}
			);
		}

		return filteredRecords as Item[];
	}

	/**
	 * Get single item by primary key
	 */
	async readOne(key: PrimaryKey, query: Query = {}, opts?: QueryOptions): Promise<Item> {
		const primaryKeyField = this.schema.collections[this.collection]!.primary;
		validateKeys(this.schema, this.collection, primaryKeyField, key);

		const filterWithKey = assign({}, query.filter, { [primaryKeyField]: { _eq: key } });
		const queryWithKey = assign({}, query, { filter: filterWithKey });

		const results = await this.readByQuery(queryWithKey, opts);

		if (results.length === 0) {
			throw new ForbiddenException();
		}

		return results[0]!;
	}

	/**
	 * Get multiple items by primary keys
	 */
	async readMany(keys: PrimaryKey[], query: Query = {}, opts?: QueryOptions): Promise<Item[]> {
		const primaryKeyField = this.schema.collections[this.collection]!.primary;
		validateKeys(this.schema, this.collection, primaryKeyField, keys);

		const filterWithKey = { _and: [{ [primaryKeyField]: { _in: keys } }, query.filter ?? {}] };
		const queryWithKey = assign({}, query, { filter: filterWithKey });

		// Set query limit as the number of keys
		if (Array.isArray(keys) && keys.length > 0 && !queryWithKey.limit) {
			queryWithKey.limit = keys.length;
		}

		const results = await this.readByQuery(queryWithKey, opts);

		return results;
	}

	/**
	 * Update multiple items by query
	 */
	async updateByQuery(query: Query, data: Partial<Item>, opts?: MutationOptions): Promise<PrimaryKey[]> {
		const keys = await this.getKeysByQuery(query);

		const primaryKeyField = this.schema.collections[this.collection]!.primary;
		validateKeys(this.schema, this.collection, primaryKeyField, keys);

		return keys.length ? await this.updateMany(keys, data, opts) : [];
	}

	/**
	 * Update a single item by primary key
	 */
	async updateOne(key: PrimaryKey, data: Partial<Item>, opts?: MutationOptions): Promise<PrimaryKey> {
		const primaryKeyField = this.schema.collections[this.collection]!.primary;
		validateKeys(this.schema, this.collection, primaryKeyField, key);

		await this.updateMany([key], data, opts);
		return key;
	}

	/**
	 * Update multiple items in a single transaction
	 */
	async updateBatch(data: Partial<Item>[], opts: MutationOptions = {}): Promise<PrimaryKey[]> {
		if (!Array.isArray(data)) {
			throw new InvalidPayloadException('Input should be an array of items.');
		}

		if (!opts.mutationTracker) opts.mutationTracker = this.createMutationTracker();

		const primaryKeyField = this.schema.collections[this.collection]!.primary;

		const keys: PrimaryKey[] = [];

		try {
			await this.knex.transaction(async (trx) => {
				const service = new ItemsService(this.collection, {
					accountability: this.accountability,
					knex: trx,
					schema: this.schema,
				});

				for (const item of data) {
					if (!item[primaryKeyField]) throw new InvalidPayloadException(`Item in update misses primary key.`);
					const combinedOpts = Object.assign({ autoPurgeCache: false }, opts);
					keys.push(await service.updateOne(item[primaryKeyField]!, omit(item, primaryKeyField), combinedOpts));
				}
			});
		} finally {
			if (this.cache && env['CACHE_AUTO_PURGE'] && opts.autoPurgeCache !== false) {
				await this.cache.clear();
			}
		}

		return keys;
	}

	/**
	 * Update many items by primary key, setting all items to the same change
	 */
	async updateMany(keys: PrimaryKey[], data: Partial<Item>, opts: MutationOptions = {}): Promise<PrimaryKey[]> {
		if (!opts.mutationTracker) opts.mutationTracker = this.createMutationTracker();

		if (!opts.bypassLimits) {
			opts.mutationTracker.trackMutations(keys.length);
		}

		const { ActivityService } = await import('./activity.js');
		const { RevisionsService } = await import('./revisions.js');

		const primaryKeyField = this.schema.collections[this.collection]!.primary;
		validateKeys(this.schema, this.collection, primaryKeyField, keys);

		const fields = Object.keys(this.schema.collections[this.collection]!.fields);

		const aliases = Object.values(this.schema.collections[this.collection]!.fields)
			.filter((field) => field.alias === true)
			.map((field) => field.field);

		const payload: Partial<AnyItem> = cloneDeep(data);
		const nestedActionEvents: ActionEventParams[] = [];

		const authorizationService = new AuthorizationService({
			accountability: this.accountability,
			knex: this.knex,
			schema: this.schema,
		});

		// Run all hooks that are attached to this event so the end user has the chance to augment the
		// item that is about to be saved
		const payloadAfterHooks =
			opts.emitEvents !== false
				? await emitter.emitFilter(
						this.eventScope === 'items'
							? ['items.update', `${this.collection}.items.update`]
							: `${this.eventScope}.update`,
						payload,
						{
							keys,
							collection: this.collection,
						},
						{
							database: this.knex,
							schema: this.schema,
							accountability: this.accountability,
						}
				  )
				: payload;

		// Sort keys to ensure that the order is maintained
		keys.sort();

		if (this.accountability) {
			await authorizationService.checkAccess('update', this.collection, keys);
		}

		const payloadWithPresets = this.accountability
			? authorizationService.validatePayload('update', this.collection, payloadAfterHooks)
			: payloadAfterHooks;

		if (opts.preMutationException) {
			throw opts.preMutationException;
		}

		await this.knex.transaction(async (trx) => {
			const payloadService = new PayloadService(this.collection, {
				accountability: this.accountability,
				knex: trx,
				schema: this.schema,
			});

			const {
				payload: payloadWithM2O,
				revisions: revisionsM2O,
				nestedActionEvents: nestedActionEventsM2O,
			} = await payloadService.processM2O(payloadWithPresets, opts);

			const {
				payload: payloadWithA2O,
				revisions: revisionsA2O,
				nestedActionEvents: nestedActionEventsA2O,
			} = await payloadService.processA2O(payloadWithM2O, opts);

			const payloadWithoutAliasAndPK = pick(payloadWithA2O, without(fields, primaryKeyField, ...aliases));
			const payloadWithTypeCasting = await payloadService.processValues('update', payloadWithoutAliasAndPK);

			if (Object.keys(payloadWithTypeCasting).length > 0) {
				try {
					await trx(this.collection).update(payloadWithTypeCasting).whereIn(primaryKeyField, keys);
				} catch (err: any) {
					throw await translateDatabaseError(err);
				}
			}

			const childrenRevisions = [...revisionsM2O, ...revisionsA2O];

			nestedActionEvents.push(...nestedActionEventsM2O);
			nestedActionEvents.push(...nestedActionEventsA2O);

			for (const key of keys) {
				const { revisions, nestedActionEvents: nestedActionEventsO2M } = await payloadService.processO2M(
					payload,
					key,
					opts
				);

				childrenRevisions.push(...revisions);
				nestedActionEvents.push(...nestedActionEventsO2M);
			}

			// If this is an authenticated action, and accountability tracking is enabled, save activity row
			if (this.accountability && this.schema.collections[this.collection]!.accountability !== null) {
				const activityService = new ActivityService({
					knex: trx,
					schema: this.schema,
				});

				const activity = await activityService.createMany(
					keys.map((key) => ({
						action: Action.UPDATE,
						user: this.accountability!.user,
						collection: this.collection,
						ip: this.accountability!.ip,
						user_agent: this.accountability!.userAgent,
						origin: this.accountability!.origin,
						item: key,
					})),
					{ bypassLimits: true }
				);

				if (this.schema.collections[this.collection]!.accountability === 'all') {
					const itemsService = new ItemsService(this.collection, {
						knex: trx,
						schema: this.schema,
					});

					const snapshots = await itemsService.readMany(keys);

					const revisionsService = new RevisionsService({
						knex: trx,
						schema: this.schema,
					});

					const revisions = (
						await Promise.all(
							activity.map(async (activity, index) => ({
								activity: activity,
								collection: this.collection,
								item: keys[index],
								data:
									snapshots && Array.isArray(snapshots) ? JSON.stringify(snapshots[index]) : JSON.stringify(snapshots),
								delta: await payloadService.prepareDelta(payloadWithTypeCasting),
							}))
						)
					).filter((revision) => revision.delta);

					const revisionIDs = await revisionsService.createMany(revisions, { bypassLimits: true });

					for (let i = 0; i < revisionIDs.length; i++) {
						const revisionID = revisionIDs[i]!;

						if (opts.onRevisionCreate) {
							opts.onRevisionCreate(revisionID);
						}

						if (i === 0) {
							// In case of a nested relational creation/update in a updateMany, the nested m2o/a2o
							// creation is only done once. We treat the first updated item as the "main" update,
							// with all other revisions on the current level as regular "flat" updates, and
							// nested revisions as children of this first "root" item.
							if (childrenRevisions.length > 0) {
								await revisionsService.updateMany(childrenRevisions, { parent: revisionID }, { bypassLimits: true });
							}
						}
					}
				}
			}
		});

		if (this.cache && env['CACHE_AUTO_PURGE'] && opts.autoPurgeCache !== false) {
			await this.cache.clear();
		}

		if (opts.emitEvents !== false) {
			const actionEvent = {
				event:
					this.eventScope === 'items'
						? ['items.update', `${this.collection}.items.update`]
						: `${this.eventScope}.update`,
				meta: {
					payload,
					keys,
					collection: this.collection,
				},
				context: {
					database: getDatabase(),
					schema: this.schema,
					accountability: this.accountability,
				},
			};

			if (opts.bypassEmitAction) {
				opts.bypassEmitAction(actionEvent);
			} else {
				emitter.emitAction(actionEvent.event, actionEvent.meta, actionEvent.context);
			}

			for (const nestedActionEvent of nestedActionEvents) {
				if (opts.bypassEmitAction) {
					opts.bypassEmitAction(nestedActionEvent);
				} else {
					emitter.emitAction(nestedActionEvent.event, nestedActionEvent.meta, nestedActionEvent.context);
				}
			}
		}

		return keys;
	}

	/**
	 * Upsert a single item
	 */
	async upsertOne(payload: Partial<Item>, opts?: MutationOptions): Promise<PrimaryKey> {
		const primaryKeyField = this.schema.collections[this.collection]!.primary;
		const primaryKey: PrimaryKey | undefined = payload[primaryKeyField];

		if (primaryKey) {
			validateKeys(this.schema, this.collection, primaryKeyField, primaryKey);
		}

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
	async upsertMany(payloads: Partial<Item>[], opts: MutationOptions = {}): Promise<PrimaryKey[]> {
		if (!opts.mutationTracker) opts.mutationTracker = this.createMutationTracker();

		const primaryKeys = await this.knex.transaction(async (trx) => {
			const service = new ItemsService(this.collection, {
				accountability: this.accountability,
				schema: this.schema,
				knex: trx,
			});

			const primaryKeys: PrimaryKey[] = [];

			for (const payload of payloads) {
				const primaryKey = await service.upsertOne(payload, { ...(opts || {}), autoPurgeCache: false });
				primaryKeys.push(primaryKey);
			}

			return primaryKeys;
		});

		if (this.cache && env['CACHE_AUTO_PURGE'] && opts.autoPurgeCache !== false) {
			await this.cache.clear();
		}

		return primaryKeys;
	}

	/**
	 * Delete multiple items by query
	 */
	async deleteByQuery(query: Query, opts?: MutationOptions): Promise<PrimaryKey[]> {
		const keys = await this.getKeysByQuery(query);

		const primaryKeyField = this.schema.collections[this.collection]!.primary;
		validateKeys(this.schema, this.collection, primaryKeyField, keys);

		return keys.length ? await this.deleteMany(keys, opts) : [];
	}

	/**
	 * Delete a single item by primary key
	 */
	async deleteOne(key: PrimaryKey, opts?: MutationOptions): Promise<PrimaryKey> {
		const primaryKeyField = this.schema.collections[this.collection]!.primary;
		validateKeys(this.schema, this.collection, primaryKeyField, key);

		await this.deleteMany([key], opts);
		return key;
	}

	/**
	 * Delete multiple items by primary key
	 */
	async deleteMany(keys: PrimaryKey[], opts: MutationOptions = {}): Promise<PrimaryKey[]> {
		if (!opts.mutationTracker) opts.mutationTracker = this.createMutationTracker();

		if (!opts.bypassLimits) {
			opts.mutationTracker.trackMutations(keys.length);
		}

		const { ActivityService } = await import('./activity.js');

		const primaryKeyField = this.schema.collections[this.collection]!.primary;
		validateKeys(this.schema, this.collection, primaryKeyField, keys);

		if (this.accountability && this.accountability.admin !== true) {
			const authorizationService = new AuthorizationService({
				accountability: this.accountability,
				schema: this.schema,
				knex: this.knex,
			});

			await authorizationService.checkAccess('delete', this.collection, keys);
		}

		if (opts.preMutationException) {
			throw opts.preMutationException;
		}

		if (opts.emitEvents !== false) {
			await emitter.emitFilter(
				this.eventScope === 'items' ? ['items.delete', `${this.collection}.items.delete`] : `${this.eventScope}.delete`,
				keys,
				{
					collection: this.collection,
				},
				{
					database: this.knex,
					schema: this.schema,
					accountability: this.accountability,
				}
			);
		}

		await this.knex.transaction(async (trx) => {
			await trx(this.collection).whereIn(primaryKeyField, keys).delete();

			if (this.accountability && this.schema.collections[this.collection]!.accountability !== null) {
				const activityService = new ActivityService({
					knex: trx,
					schema: this.schema,
				});

				await activityService.createMany(
					keys.map((key) => ({
						action: Action.DELETE,
						user: this.accountability!.user,
						collection: this.collection,
						ip: this.accountability!.ip,
						user_agent: this.accountability!.userAgent,
						origin: this.accountability!.origin,
						item: key,
					})),
					{ bypassLimits: true }
				);
			}
		});

		if (this.cache && env['CACHE_AUTO_PURGE'] && opts?.autoPurgeCache !== false) {
			await this.cache.clear();
		}

		if (opts.emitEvents !== false) {
			const actionEvent = {
				event:
					this.eventScope === 'items'
						? ['items.delete', `${this.collection}.items.delete`]
						: `${this.eventScope}.delete`,
				meta: {
					payload: keys,
					keys: keys,
					collection: this.collection,
				},
				context: {
					database: getDatabase(),
					schema: this.schema,
					accountability: this.accountability,
				},
			};

			if (opts.bypassEmitAction) {
				opts.bypassEmitAction(actionEvent);
			} else {
				emitter.emitAction(actionEvent.event, actionEvent.meta, actionEvent.context);
			}
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
			let fields = Object.entries(this.schema.collections[this.collection]!.fields);
			const defaults: Record<string, any> = {};

			if (query.fields && query.fields.includes('*') === false) {
				fields = fields.filter(([name]) => {
					return query.fields!.includes(name);
				});
			}

			for (const [name, field] of fields) {
				if (this.schema.collections[this.collection]!.primary === name) {
					defaults[name] = null;
					continue;
				}

				if (field.defaultValue !== null) defaults[name] = field.defaultValue;
			}

			return defaults as Partial<Item>;
		}

		return record;
	}

	/**
	 * Upsert/treat collection as singleton
	 */
	async upsertSingleton(data: Partial<Item>, opts?: MutationOptions): Promise<PrimaryKey> {
		const primaryKeyField = this.schema.collections[this.collection]!.primary;

		const record = await this.knex.select(primaryKeyField).from(this.collection).limit(1).first();

		if (record) {
			return await this.updateOne(record[primaryKeyField], data, opts);
		}

		return await this.createOne(data, opts);
	}
}
