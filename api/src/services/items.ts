import { Action } from '@directus/constants';
import { useEnv } from '@directus/env';
import { ErrorCode, ForbiddenError, InvalidPayloadError, isDirectusError } from '@directus/errors';
import { isSystemCollection } from '@directus/system-data';
import type {
	AbstractService,
	AbstractServiceOptions,
	Accountability,
	ActionEventParams,
	Item as AnyItem,
	MutationOptions,
	MutationTracker,
	PrimaryKey,
	Query,
	QueryOptions,
	SchemaOverview,
} from '@directus/types';
import { NEW_VERSION, UserIntegrityCheckFlag } from '@directus/types';
import type Keyv from 'keyv';
import type { Knex } from 'knex';
import { assign, clone, cloneDeep, omit, pick, without } from 'lodash-es';
import { getCache } from '../cache.js';
import { translateDatabaseError } from '../database/errors/translate.js';
import { getAstFromQuery } from '../database/get-ast-from-query/get-ast-from-query.js';
import { getHelpers } from '../database/helpers/index.js';
import getDatabase, { getDatabaseClient } from '../database/index.js';
import { runAst } from '../database/run-ast/run-ast.js';
import emitter from '../emitter.js';
import { processAst } from '../permissions/modules/process-ast/process-ast.js';
import { processPayload } from '../permissions/modules/process-payload/process-payload.js';
import { validateAccess } from '../permissions/modules/validate-access/validate-access.js';
import { shouldClearCache } from '../utils/should-clear-cache.js';
import { transaction } from '../utils/transaction.js';
import { validateKeys } from '../utils/validate-keys.js';
import { validateUserCountIntegrity } from '../utils/validate-user-count-integrity.js';
import { handleVersion } from '../utils/versioning/handle-version.js';
import { PayloadService } from './payload.js';

const env = useEnv();

export class ItemsService<Item extends AnyItem = AnyItem, Collection extends string = string>
	implements AbstractService<Item>
{
	collection: Collection;
	knex: Knex;
	accountability: Accountability | null;
	eventScope: string;
	schema: SchemaOverview;
	cache: Keyv<any> | null;
	nested: string[];

	constructor(collection: Collection, options: AbstractServiceOptions) {
		this.collection = collection;
		this.knex = options.knex || getDatabase();
		this.accountability = options.accountability || null;
		this.eventScope = isSystemCollection(this.collection) ? this.collection.substring(9) : 'items';
		this.schema = options.schema;
		this.cache = getCache().cache;
		this.nested = options.nested ?? [];

		return this;
	}

	/**
	 * Create a fork of the current service, allowing instantiation with different options.
	 */
	private fork(options?: Partial<AbstractServiceOptions>): ItemsService<AnyItem> {
		const Service = this.constructor;

		// ItemsService expects `collection` and `options` as parameters,
		// while the other services only expect `options`
		const isItemsService = Service.length === 2;

		const newOptions = {
			knex: this.knex,
			accountability: this.accountability,
			schema: this.schema,
			nested: this.nested,
			...options,
		};

		if (isItemsService) {
			return new ItemsService(this.collection, newOptions);
		}

		return new (Service as new (options: AbstractServiceOptions) => this)(newOptions);
	}

	createMutationTracker(initialCount = 0): MutationTracker {
		const maxCount = Number(env['MAX_BATCH_MUTATION']);
		let mutationCount = initialCount;
		return {
			trackMutations(count: number) {
				mutationCount += count;

				if (mutationCount > maxCount) {
					throw new InvalidPayloadError({ reason: `Exceeded max batch mutation limit of ${maxCount}` });
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

		const primaryKeyField = this.schema.collections[this.collection]!.primary;
		const fields = Object.keys(this.schema.collections[this.collection]!.fields);

		const aliases = Object.values(this.schema.collections[this.collection]!.fields)
			.filter((field) => field.alias === true)
			.map((field) => field.field);

		const payload: AnyItem = cloneDeep(data);
		let actionHookPayload = payload;
		const nestedActionEvents: ActionEventParams[] = [];

		/**
		 * By wrapping the logic in a transaction, we make sure we automatically roll back all the
		 * changes in the DB if any of the parts contained within throws an error. This also means
		 * that any errors thrown in any nested relational changes will bubble up and cancel the whole
		 * update tree
		 */
		const primaryKey: PrimaryKey = await transaction(this.knex, async (trx) => {
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
							},
						)
					: payload;

			const payloadWithPresets = this.accountability
				? await processPayload(
						{
							accountability: this.accountability,
							action: 'create',
							collection: this.collection,
							payload: payloadAfterHooks,
							nested: this.nested,
						},
						{
							knex: trx,
							schema: this.schema,
						},
					)
				: payloadAfterHooks;

			if (opts.preMutationError) {
				throw opts.preMutationError;
			}

			// Ensure the action hook payload has the post filter hook + preset changes
			actionHookPayload = payloadWithPresets;

			// We're creating new services instances so they can use the transaction as their Knex interface
			const payloadService = new PayloadService(this.collection, {
				accountability: this.accountability,
				knex: trx,
				schema: this.schema,
				nested: this.nested,
				overwriteDefaults: opts.overwriteDefaults,
			});

			const {
				payload: payloadWithM2O,
				revisions: revisionsM2O,
				nestedActionEvents: nestedActionEventsM2O,
				userIntegrityCheckFlags: userIntegrityCheckFlagsM2O,
			} = await payloadService.processM2O(payloadWithPresets, opts);

			const {
				payload: payloadWithA2O,
				revisions: revisionsA2O,
				nestedActionEvents: nestedActionEventsA2O,
				userIntegrityCheckFlags: userIntegrityCheckFlagsA2O,
			} = await payloadService.processA2O(payloadWithM2O, opts);

			const payloadWithoutAliases = pick(payloadWithA2O, without(fields, ...aliases));
			const payloadWithTypeCasting = await payloadService.processValues('create', payloadWithoutAliases);

			// The primary key can already exist in the payload.
			// In case of manual string / UUID primary keys it's always provided at this point.
			// In case of an (big) integer primary key, it might be provided as the user can specify the value manually.
			let primaryKey: undefined | PrimaryKey = payloadWithTypeCasting[primaryKeyField];

			if (primaryKey) {
				validateKeys(this.schema, this.collection, primaryKeyField, primaryKey);
			}

			// If a PK of type number was provided, although the PK is set the auto_increment,
			// depending on the database, the sequence might need to be reset to protect future PK collisions.
			let autoIncrementSequenceNeedsToBeReset = false;

			const pkField = this.schema.collections[this.collection]!.fields[primaryKeyField];

			if (
				primaryKey &&
				pkField &&
				!opts.bypassAutoIncrementSequenceReset &&
				['integer', 'bigInteger'].includes(pkField.type) &&
				pkField.defaultValue === 'AUTO_INCREMENT'
			) {
				autoIncrementSequenceNeedsToBeReset = true;
			}

			try {
				let returningOptions = undefined;

				// Support MSSQL tables that have triggers.
				if (getDatabaseClient(trx) === 'mssql') {
					returningOptions = { includeTriggerModifications: true };
				}

				const result = await trx
					.insert(payloadWithoutAliases)
					.into(this.collection)
					.returning(primaryKeyField, returningOptions)
					.then((result) => result[0]);

				const returnedKey = typeof result === 'object' ? result[primaryKeyField] : result;

				if (pkField!.type === 'uuid') {
					primaryKey = getHelpers(trx).schema.formatUUID(primaryKey ?? returnedKey);
				} else {
					primaryKey = primaryKey ?? returnedKey;
				}
			} catch (err: any) {
				const dbError = await translateDatabaseError(err, data);

				if (isDirectusError(dbError, ErrorCode.RecordNotUnique) && dbError.extensions.primaryKey) {
					// This is a MySQL specific thing we need to handle here, since MySQL does not return the field name
					// if the unique constraint is the primary key
					dbError.extensions.field = pkField?.field ?? null;

					delete dbError.extensions.primaryKey;
				}

				throw dbError;
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
				actionHookPayload[primaryKeyField] = primaryKey;
			}

			// At this point, the primary key is guaranteed to be set.
			primaryKey = primaryKey as PrimaryKey;

			const {
				revisions: revisionsO2M,
				nestedActionEvents: nestedActionEventsO2M,
				userIntegrityCheckFlags: userIntegrityCheckFlagsO2M,
			} = await payloadService.processO2M(payloadWithPresets, primaryKey, opts);

			nestedActionEvents.push(...nestedActionEventsM2O);
			nestedActionEvents.push(...nestedActionEventsA2O);
			nestedActionEvents.push(...nestedActionEventsO2M);

			const userIntegrityCheckFlags =
				(opts.userIntegrityCheckFlags ?? UserIntegrityCheckFlag.None) |
				userIntegrityCheckFlagsM2O |
				userIntegrityCheckFlagsA2O |
				userIntegrityCheckFlagsO2M;

			if (userIntegrityCheckFlags) {
				if (opts.onRequireUserIntegrityCheck) {
					opts.onRequireUserIntegrityCheck(userIntegrityCheckFlags);
				} else {
					await validateUserCountIntegrity({ flags: userIntegrityCheckFlags, knex: trx });
				}
			}

			// If this is an authenticated action, and accountability tracking is enabled, save activity row
			if (
				opts.skipTracking !== true &&
				this.accountability &&
				this.schema.collections[this.collection]!.accountability !== null
			) {
				const { ActivityService } = await import('./activity.js');
				const { RevisionsService } = await import('./revisions.js');

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
						await revisionsService.updateMany(childrenRevisions, { parent: revision });
					}

					if (opts.onRevisionCreate) {
						opts.onRevisionCreate(revision);
					}
				}
			}

			if (autoIncrementSequenceNeedsToBeReset) {
				await getHelpers(trx).sequence.resetAutoIncrementSequence(this.collection, primaryKeyField);
			}

			if (opts.onItemCreate) {
				opts.onItemCreate(this.collection, primaryKey);
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
					payload: actionHookPayload,
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

		if (shouldClearCache(this.cache, opts, this.collection)) {
			await this.cache.clear();
		}

		return primaryKey;
	}

	/**
	 * Create multiple new items at once. Inserts all provided records sequentially wrapped in a transaction.
	 *
	 * Uses `this.createOne` under the hood.
	 */
	async createMany(data: Partial<Item>[], opts: MutationOptions = {}): Promise<PrimaryKey[]> {
		if (!opts.mutationTracker) opts.mutationTracker = this.createMutationTracker();

		const { primaryKeys, nestedActionEvents } = await transaction(this.knex, async (knex) => {
			const service = this.fork({ knex });

			let userIntegrityCheckFlags = opts.userIntegrityCheckFlags ?? UserIntegrityCheckFlag.None;

			const primaryKeys: PrimaryKey[] = [];
			const nestedActionEvents: ActionEventParams[] = [];

			const pkField = this.schema.collections[this.collection]!.primary;

			for (const [index, payload] of data.entries()) {
				let bypassAutoIncrementSequenceReset = true;

				// the auto_increment sequence needs to be reset if the current item contains a manual PK and
				// if it's the last item of the batch or if the next item doesn't include a PK and hence one needs to be generated
				if (payload[pkField] && (index === data.length - 1 || !data[index + 1]?.[pkField])) {
					bypassAutoIncrementSequenceReset = false;
				}

				const primaryKey = await service.createOne(payload, {
					...(opts || {}),
					autoPurgeCache: false,
					onRequireUserIntegrityCheck: (flags) => (userIntegrityCheckFlags |= flags),
					bypassEmitAction: (params) => nestedActionEvents.push(params),
					mutationTracker: opts.mutationTracker,
					overwriteDefaults: opts.overwriteDefaults?.[index],
					bypassAutoIncrementSequenceReset,
				});

				primaryKeys.push(primaryKey);
			}

			if (userIntegrityCheckFlags) {
				if (opts.onRequireUserIntegrityCheck) {
					opts.onRequireUserIntegrityCheck(userIntegrityCheckFlags);
				} else {
					await validateUserCountIntegrity({ flags: userIntegrityCheckFlags, knex });
				}
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

		if (shouldClearCache(this.cache, opts, this.collection)) {
			await this.cache.clear();
		}

		return primaryKeys;
	}

	/**
	 * Get items by query.
	 */
	async readByQuery(query: Query, opts?: QueryOptions): Promise<Item[]> {
		if (query.version && query.version !== 'main') {
			return (await handleVersion(this, opts?.key ?? null, query, opts)) as Item[];
		}

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
						},
					)
				: query;

		let ast = await getAstFromQuery(
			{
				collection: this.collection,
				query: updatedQuery,
				accountability: this.accountability,
			},
			{
				schema: this.schema,
				knex: this.knex,
			},
		);

		ast = await processAst(
			{ ast, action: 'read', accountability: this.accountability },
			{ knex: this.knex, schema: this.schema },
		);

		const records = await runAst(ast, this.schema, this.accountability, {
			knex: this.knex,
			// GraphQL requires relational keys to be returned regardless
			stripNonRequested: opts?.stripNonRequested !== undefined ? opts.stripNonRequested : true,
		});

		// TODO when would this happen?
		if (records === null) {
			throw new ForbiddenError();
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
						},
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
				},
			);
		}

		return filteredRecords as Item[];
	}

	/**
	 * Get single item by primary key.
	 *
	 * Uses `this.readByQuery` under the hood.
	 */
	async readOne(key: PrimaryKey, query: Query = {}, opts?: QueryOptions): Promise<Item> {
		const primaryKeyField = this.schema.collections[this.collection]!.primary;

		let results: Item[] = [];

		if (query.version && key === '+') {
			results = await this.readByQuery(query, { ...opts, key: NEW_VERSION });
		} else {
			validateKeys(this.schema, this.collection, primaryKeyField, key);

			const filterWithKey = assign({}, query.filter, { [primaryKeyField]: { _eq: key } });
			const queryWithKey = assign({}, query, { filter: filterWithKey });

			results = await this.readByQuery(queryWithKey, { ...opts, key });
		}

		if (results.length === 0) {
			throw new ForbiddenError();
		}

		return results[0]!;
	}

	/**
	 * Get multiple items by primary keys.
	 *
	 * Uses `this.readByQuery` under the hood.
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

		let results: Item[] = [];

		results = await this.readByQuery(queryWithKey, opts);

		return results;
	}

	/**
	 * Update multiple items by query.
	 *
	 * Uses `this.updateMany` under the hood.
	 */
	async updateByQuery(query: Query, data: Partial<Item>, opts?: MutationOptions): Promise<PrimaryKey[]> {
		const keys = await this.getKeysByQuery(query);

		return keys.length ? await this.updateMany(keys, data, opts) : [];
	}

	/**
	 * Update a single item by primary key.
	 *
	 * Uses `this.updateMany` under the hood.
	 */
	async updateOne(key: PrimaryKey, data: Partial<Item>, opts?: MutationOptions): Promise<PrimaryKey> {
		await this.updateMany([key], data, opts);
		return key;
	}

	/**
	 * Update multiple items in a single transaction.
	 *
	 * Uses `this.updateOne` under the hood.
	 */
	async updateBatch(data: Partial<Item>[], opts: MutationOptions = {}): Promise<PrimaryKey[]> {
		if (!Array.isArray(data)) {
			throw new InvalidPayloadError({ reason: 'Input should be an array of items' });
		}

		if (!opts.mutationTracker) opts.mutationTracker = this.createMutationTracker();

		const primaryKeyField = this.schema.collections[this.collection]!.primary;

		const keys: PrimaryKey[] = [];

		try {
			await transaction(this.knex, async (knex) => {
				const service = this.fork({ knex });

				let userIntegrityCheckFlags = opts.userIntegrityCheckFlags ?? UserIntegrityCheckFlag.None;

				for (const index in data) {
					const item = data[index]!;
					const primaryKey = item[primaryKeyField];
					if (!primaryKey) throw new InvalidPayloadError({ reason: `Item in update misses primary key` });

					const combinedOpts: MutationOptions = {
						autoPurgeCache: false,
						...opts,
						overwriteDefaults: opts.overwriteDefaults?.[index],
						onRequireUserIntegrityCheck: (flags) => (userIntegrityCheckFlags |= flags),
					};

					keys.push(await service.updateOne(primaryKey, omit(item, primaryKeyField), combinedOpts));
				}

				if (userIntegrityCheckFlags) {
					if (opts.onRequireUserIntegrityCheck) {
						opts.onRequireUserIntegrityCheck(userIntegrityCheckFlags);
					} else {
						await validateUserCountIntegrity({ flags: userIntegrityCheckFlags, knex });
					}
				}
			});
		} finally {
			if (shouldClearCache(this.cache, opts, this.collection)) {
				await this.cache.clear();
			}
		}

		return keys;
	}

	/**
	 * Update many items by primary key, setting all items to the same change.
	 */
	async updateMany(keys: PrimaryKey[], data: Partial<Item>, opts: MutationOptions = {}): Promise<PrimaryKey[]> {
		if (!opts.mutationTracker) opts.mutationTracker = this.createMutationTracker();

		if (!opts.bypassLimits) {
			opts.mutationTracker.trackMutations(keys.length);
		}

		const primaryKeyField = this.schema.collections[this.collection]!.primary;
		validateKeys(this.schema, this.collection, primaryKeyField, keys);

		const fields = Object.keys(this.schema.collections[this.collection]!.fields);

		const aliases = Object.values(this.schema.collections[this.collection]!.fields)
			.filter((field) => field.alias === true)
			.map((field) => field.field);

		const payload: Partial<AnyItem> = cloneDeep(data);
		const nestedActionEvents: ActionEventParams[] = [];

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
						},
					)
				: payload;

		// Sort keys to ensure that the order is maintained
		keys.sort();

		if (this.accountability) {
			await validateAccess(
				{
					accountability: this.accountability,
					action: 'update',
					collection: this.collection,
					primaryKeys: keys,
					fields: Object.keys(payloadAfterHooks),
				},
				{
					schema: this.schema,
					knex: this.knex,
				},
			);
		}

		const payloadWithPresets = this.accountability
			? await processPayload(
					{
						accountability: this.accountability,
						action: 'update',
						collection: this.collection,
						payload: payloadAfterHooks,
						nested: this.nested,
					},
					{
						knex: this.knex,
						schema: this.schema,
					},
				)
			: payloadAfterHooks;

		if (opts.preMutationError) {
			throw opts.preMutationError;
		}

		await transaction(this.knex, async (trx) => {
			const payloadService = new PayloadService(this.collection, {
				accountability: this.accountability,
				knex: trx,
				schema: this.schema,
				nested: this.nested,
				overwriteDefaults: opts.overwriteDefaults,
			});

			const {
				payload: payloadWithM2O,
				revisions: revisionsM2O,
				nestedActionEvents: nestedActionEventsM2O,
				userIntegrityCheckFlags: userIntegrityCheckFlagsM2O,
			} = await payloadService.processM2O(payloadWithPresets, opts);

			const {
				payload: payloadWithA2O,
				revisions: revisionsA2O,
				nestedActionEvents: nestedActionEventsA2O,
				userIntegrityCheckFlags: userIntegrityCheckFlagsA2O,
			} = await payloadService.processA2O(payloadWithM2O, opts);

			const payloadWithoutAliasAndPK = pick(payloadWithA2O, without(fields, primaryKeyField, ...aliases));
			const payloadWithTypeCasting = await payloadService.processValues('update', payloadWithoutAliasAndPK);

			if (Object.keys(payloadWithTypeCasting).length > 0) {
				try {
					await trx(this.collection).update(payloadWithTypeCasting).whereIn(primaryKeyField, keys);
				} catch (err: any) {
					throw await translateDatabaseError(err, data);
				}
			}

			const childrenRevisions = [...revisionsM2O, ...revisionsA2O];

			let userIntegrityCheckFlags =
				opts.userIntegrityCheckFlags ??
				UserIntegrityCheckFlag.None | userIntegrityCheckFlagsM2O | userIntegrityCheckFlagsA2O;

			nestedActionEvents.push(...nestedActionEventsM2O);
			nestedActionEvents.push(...nestedActionEventsA2O);

			for (const key of keys) {
				const {
					revisions,
					nestedActionEvents: nestedActionEventsO2M,
					userIntegrityCheckFlags: userIntegrityCheckFlagsO2M,
				} = await payloadService.processO2M(payloadWithA2O, key, opts);

				childrenRevisions.push(...revisions);
				nestedActionEvents.push(...nestedActionEventsO2M);
				userIntegrityCheckFlags |= userIntegrityCheckFlagsO2M;
			}

			if (userIntegrityCheckFlags) {
				if (opts?.onRequireUserIntegrityCheck) {
					opts.onRequireUserIntegrityCheck(userIntegrityCheckFlags);
				} else {
					// Having no onRequireUserIntegrityCheck callback indicates that
					// this is the top level invocation of the nested updates, so perform the user integrity check
					await validateUserCountIntegrity({ flags: userIntegrityCheckFlags, knex: trx });
				}
			}

			// If this is an authenticated action, and accountability tracking is enabled, save activity row
			if (
				opts.skipTracking !== true &&
				this.accountability &&
				this.schema.collections[this.collection]!.accountability !== null
			) {
				const { ActivityService } = await import('./activity.js');
				const { RevisionsService } = await import('./revisions.js');

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
					{ bypassLimits: true },
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
							})),
						)
					).filter((revision) => revision.delta);

					const revisionIDs = await revisionsService.createMany(revisions);

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
								await revisionsService.updateMany(childrenRevisions, { parent: revisionID });
							}
						}
					}
				}
			}
		});

		if (shouldClearCache(this.cache, opts, this.collection)) {
			await this.cache.clear();
		}

		if (opts.emitEvents !== false) {
			const actionEvent = {
				event:
					this.eventScope === 'items'
						? ['items.update', `${this.collection}.items.update`]
						: `${this.eventScope}.update`,
				meta: {
					payload: payloadWithPresets,
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
	 * Upsert a single item.
	 *
	 * Uses `this.createOne` / `this.updateOne` under the hood.
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
			const { [primaryKeyField]: _, ...data } = payload;
			return await this.updateOne(primaryKey as PrimaryKey, data as Partial<Item>, opts);
		} else {
			return await this.createOne(payload, opts);
		}
	}

	/**
	 * Upsert many items.
	 *
	 * Uses `this.upsertOne` under the hood.
	 */
	async upsertMany(payloads: Partial<Item>[], opts: MutationOptions = {}): Promise<PrimaryKey[]> {
		if (!opts.mutationTracker) opts.mutationTracker = this.createMutationTracker();

		const primaryKeys = await transaction(this.knex, async (knex) => {
			const service = this.fork({ knex });

			const primaryKeys: PrimaryKey[] = [];

			for (const index in payloads) {
				const payload = payloads[index]!;

				const primaryKey = await service.upsertOne(payload, {
					...(opts || {}),
					overwriteDefaults: opts.overwriteDefaults?.[index],
					autoPurgeCache: false,
				});

				primaryKeys.push(primaryKey);
			}

			return primaryKeys;
		});

		if (shouldClearCache(this.cache, opts, this.collection)) {
			await this.cache.clear();
		}

		return primaryKeys;
	}

	/**
	 * Delete multiple items by query.
	 *
	 * Uses `this.deleteMany` under the hood.
	 */
	async deleteByQuery(query: Query, opts?: MutationOptions): Promise<PrimaryKey[]> {
		const keys = await this.getKeysByQuery(query);

		const primaryKeyField = this.schema.collections[this.collection]!.primary;
		validateKeys(this.schema, this.collection, primaryKeyField, keys);

		return keys.length ? await this.deleteMany(keys, opts) : [];
	}

	/**
	 * Delete a single item by primary key.
	 *
	 * Uses `this.deleteMany` under the hood.
	 */
	async deleteOne(key: PrimaryKey, opts?: MutationOptions): Promise<PrimaryKey> {
		const primaryKeyField = this.schema.collections[this.collection]!.primary;
		validateKeys(this.schema, this.collection, primaryKeyField, key);

		await this.deleteMany([key], opts);
		return key;
	}

	/**
	 * Delete multiple items by primary key.
	 */
	async deleteMany(keys: PrimaryKey[], opts: MutationOptions = {}): Promise<PrimaryKey[]> {
		if (!opts.mutationTracker) opts.mutationTracker = this.createMutationTracker();

		if (!opts.bypassLimits) {
			opts.mutationTracker.trackMutations(keys.length);
		}

		const primaryKeyField = this.schema.collections[this.collection]!.primary;
		validateKeys(this.schema, this.collection, primaryKeyField, keys);

		const keysAfterHooks =
			opts.emitEvents !== false
				? await emitter.emitFilter(
						this.eventScope === 'items'
							? ['items.delete', `${this.collection}.items.delete`]
							: `${this.eventScope}.delete`,
						keys,
						{
							collection: this.collection,
						},
						{
							database: this.knex,
							schema: this.schema,
							accountability: this.accountability,
						},
					)
				: keys;

		if (this.accountability) {
			await validateAccess(
				{
					accountability: this.accountability,
					action: 'delete',
					collection: this.collection,
					primaryKeys: keysAfterHooks,
				},
				{
					knex: this.knex,
					schema: this.schema,
				},
			);
		}

		if (opts.preMutationError) {
			throw opts.preMutationError;
		}

		await transaction(this.knex, async (trx) => {
			await trx(this.collection).whereIn(primaryKeyField, keysAfterHooks).delete();

			if (opts.userIntegrityCheckFlags) {
				if (opts.onRequireUserIntegrityCheck) {
					opts.onRequireUserIntegrityCheck(opts.userIntegrityCheckFlags);
				} else {
					await validateUserCountIntegrity({ flags: opts.userIntegrityCheckFlags, knex: trx });
				}
			}

			if (
				opts.skipTracking !== true &&
				this.accountability &&
				this.schema.collections[this.collection]!.accountability !== null
			) {
				const { ActivityService } = await import('./activity.js');

				const activityService = new ActivityService({
					knex: trx,
					schema: this.schema,
				});

				await activityService.createMany(
					keysAfterHooks.map((key) => ({
						action: Action.DELETE,
						user: this.accountability!.user,
						collection: this.collection,
						ip: this.accountability!.ip,
						user_agent: this.accountability!.userAgent,
						origin: this.accountability!.origin,
						item: key,
					})),
					{ bypassLimits: true },
				);
			}
		});

		if (shouldClearCache(this.cache, opts, this.collection)) {
			await this.cache.clear();
		}

		if (opts.emitEvents !== false) {
			const actionEvent = {
				event:
					this.eventScope === 'items'
						? ['items.delete', `${this.collection}.items.delete`]
						: `${this.eventScope}.delete`,
				meta: {
					payload: keysAfterHooks,
					keys: keysAfterHooks,
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

		return keysAfterHooks;
	}

	/**
	 * Read/treat collection as singleton.
	 */
	async readSingleton(query: Query, opts?: QueryOptions): Promise<Partial<Item>> {
		query = clone(query);

		query.limit = 1;

		if (query.version && query.version !== 'main') {
			const primaryKeyField = this.schema.collections[this.collection]!.primary;
			const key = (await this.knex.select(primaryKeyField).from(this.collection).first())?.[primaryKeyField];
			opts = { ...opts, key };
		}

		const record = (await this.readByQuery(query, opts))[0];

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
	 * Upsert/treat collection as singleton.
	 *
	 * Uses `this.createOne` / `this.updateOne` under the hood.
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
