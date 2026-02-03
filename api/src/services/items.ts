import { Action } from '@directus/constants';
import { useEnv } from '@directus/env';
import { ErrorCode, ForbiddenError, InvalidPayloadError, isDirectusError } from '@directus/errors';
import { isSystemCollection } from '@directus/system-data';
import type {
	Accountability,
	Item as AnyItem,
	PermissionsAction,
	PrimaryKey,
	Query,
	SchemaOverview,
	JsonValue,
} from '@directus/types';

type Primitive = undefined | null | string | number | boolean | bigint | symbol; // Why isn't it exported from @directus/types?

import type Keyv from 'keyv';
import type { Knex } from 'knex';
import { assign, clone, cloneDeep, omit, pick, without, isEqual, reduce } from 'lodash-es';
import { getCache } from '../cache.js';
import { throwDatabaseError, translateDatabaseError } from '../database/errors/translate.js';
import { getAstFromQuery } from '../database/get-ast-from-query/get-ast-from-query.js';
import { getHelpers } from '../database/helpers/index.js';
import getDatabase from '../database/index.js';
import { runAst } from '../database/run-ast/run-ast.js';
import emitter from '../emitter.js';
import { processAst } from '../permissions/modules/process-ast/process-ast.js';
import { processPayload } from '../permissions/modules/process-payload/process-payload.js';
import { validateAccess } from '../permissions/modules/validate-access/validate-access.js';
import type { AbstractService, AbstractServiceOptions, ActionEventParams, MutationOptions } from '../types/index.js';
import { shouldClearCache } from '../utils/should-clear-cache.js';
import { transaction } from '../utils/transaction.js';
import { validateKeys } from '../utils/validate-keys.js';
import { UserIntegrityCheckFlag, validateUserCountIntegrity } from '../utils/validate-user-count-integrity.js';
import { PayloadService } from './payload.js';

const env = useEnv();

export type QueryOptions = {
	stripNonRequested?: boolean;
	permissionsAction?: PermissionsAction;
	emitEvents?: boolean;
};

export type MutationTracker = {
	trackMutations: (count: number) => void;
	getCount: () => number;
};

export class ItemsService<Item extends AnyItem = AnyItem, Collection extends string = string>
	implements AbstractService
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
		// TODO use createMany here

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

			if (
				payloadAfterHooks === null ||
				typeof payloadAfterHooks === 'string' ||
				typeof payloadAfterHooks === 'number'
			) {
				return payloadAfterHooks;
			}

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

				let dbQuery = trx
					.insert(payloadWithoutAliases)
					.into(this.collection)
					.returning(primaryKeyField)
					.then((result) => result[0]);

				dbQuery = (await emitter.emitFilter(
					['items.db.insert', `${this.collection}.db.insert`],
					dbQuery,
					{
						collection: this.collection,
						payload,
						// payloadWithoutAliases,
					},
					{
						database: trx,
						schema: this.schema,
						accountability: this.accountability,
					},
				)) as unknown as typeof dbQuery // TODO: fix emitFilter typing

				const result = await dbQuery;

				const filteredResult = (await emitter.emitFilter(
					['items.db.inserted', `${this.collection}.db.inserted`],
					result,
					{
						collection: this.collection,
						payload,
					},
					{
						database: trx,
						schema: this.schema,
						accountability: this.accountability,
					},
				))

				const returnedKey = typeof filteredResult === 'object'
					? filteredResult[primaryKeyField]
					: filteredResult;

				if (pkField!.type === 'uuid') {
					primaryKey = getHelpers(trx).schema.formatUUID(primaryKey ?? returnedKey);
				} else {
					primaryKey = primaryKey ?? returnedKey;
				}
			} catch (err: any) {
				// console.log('createOne(): Sql error', {
				// 	err,
				// 	data,
				// })

				const dbError = await translateDatabaseError(err, data);

				if (isDirectusError(dbError, ErrorCode.RecordNotUnique) && dbError.extensions.primaryKey) {
					// This is a MySQL specific thing we need to handle here, since MySQL does not return the field name
					// if the unique constraint is the primary key
					dbError.extensions.field = pkField?.field ?? null;

					delete dbError.extensions.primaryKey;
				}

				if (dbError) {
					throw dbError;
				}
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
				await opts.bypassEmitAction(actionEvent);
			} else {
				await emitter.emitAction(actionEvent.event, actionEvent.meta, actionEvent.context);
			}

			for (const nestedActionEvent of nestedActionEvents) {
				if (opts.bypassEmitAction) {
					await opts.bypassEmitAction(nestedActionEvent);
				} else {
					await emitter.emitAction(nestedActionEvent.event, nestedActionEvent.meta, nestedActionEvent.context);
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
	async createMany(
		data: Partial<Item>[],
		opts: MutationOptions = {}
	): Promise<PrimaryKey[]> {
		return await this.createManyAtOnce(data, opts);
		// if (!opts.mutationTracker) opts.mutationTracker = this.createMutationTracker();

		// const { primaryKeys, nestedActionEvents } = await transaction(this.knex, async (knex) => {
		// 	const service = this.fork({ knex });

		// 	let userIntegrityCheckFlags = opts.userIntegrityCheckFlags ?? UserIntegrityCheckFlag.None;

		// 	const primaryKeys: PrimaryKey[] = [];
		// 	const nestedActionEvents: ActionEventParams[] = [];

		// 	const pkField = this.schema.collections[this.collection]!.primary;

		// 	for (const [index, payload] of data.entries()) {
		// 		let bypassAutoIncrementSequenceReset = true;

		// 		// the auto_increment sequence needs to be reset if the current item contains a manual PK and
		// 		// if it's the last item of the batch or if the next item doesn't include a PK and hence one needs to be generated
		// 		if (payload[pkField] && (index === data.length - 1 || !data[index + 1]?.[pkField])) {
		// 			bypassAutoIncrementSequenceReset = false;
		// 		}

		// 		const primaryKey = await service.createOne(payload, {
		// 			...(opts || {}),
		// 			autoPurgeCache: false,
		// 			onRequireUserIntegrityCheck: (flags) => (userIntegrityCheckFlags |= flags),
		// 			bypassEmitAction: (params) => nestedActionEvents.push(params),
		// 			mutationTracker: opts.mutationTracker,
		// 			bypassAutoIncrementSequenceReset,
		// 		});

		// 		primaryKeys.push(primaryKey);
		// 	}

		// 	if (userIntegrityCheckFlags) {
		// 		if (opts.onRequireUserIntegrityCheck) {
		// 			opts.onRequireUserIntegrityCheck(userIntegrityCheckFlags);
		// 		} else {
		// 			await validateUserCountIntegrity({ flags: userIntegrityCheckFlags, knex });
		// 		}
		// 	}

		// 	return { primaryKeys, nestedActionEvents };
		// });

		// if (opts.emitEvents !== false) {
		// 	for (const nestedActionEvent of nestedActionEvents) {
		// 		if (opts.bypassEmitAction) {
		// 			await opts.bypassEmitAction(nestedActionEvent);
		// 		} else {
		// 			await emitter.emitAction(nestedActionEvent.event, nestedActionEvent.meta, nestedActionEvent.context);
		// 		}
		// 	}
		// }

		// if (shouldClearCache(this.cache, opts, this.collection)) {
		// 	await this.cache.clear();
		// }

		// return primaryKeys;
	}


	isMariaDbStore: boolean | undefined
	async isMariaDb() {
		if (this.isMariaDbStore !== undefined) {
			return this.isMariaDbStore
		}

		const { version } = await this.knex
		.select(this.knex.raw('VERSION() as version'))
		.first();

		const isMariaDb = version.split('-').includes('MariaDB');
		return this.isMariaDbStore = isMariaDb
	}


	async createManyAtOnce<T extends AnyItem>(
		this: ItemsService,
		data: Partial<T>[],
		opts: MutationOptions = {}
	): Promise<PrimaryKey[]> {
		if (data.length === 0) {
			return []
		}

		if (! opts.mutationTracker) {
			opts.mutationTracker = this.createMutationTracker()
		}

		if (! opts.bypassLimits) {
			opts.mutationTracker.trackMutations(data.length)
		}

		const primaryKeyField = this.schema.collections[this.collection]!.primary
		const fields = Object.keys(this.schema.collections[this.collection]!.fields)

		const aliases = Object.values(this.schema.collections[this.collection]!.fields)
		.filter((field) => field.alias === true)
		.map((field) => field.field)

		// TODO move it to a lib
		const isPrimaryKey = (it: unknown): it is PrimaryKey => {
			return typeof it === 'number' || typeof it === 'string'
		}

		const isNotPrimaryKey = <T>(it: T): it is T extends PrimaryKey ? never : T => {
			return ! isPrimaryKey(it)
		}


		// By wrapping the logic in a transaction, we make sure we automatically roll back all the
		// changes in the DB if any of the parts contained within throws an error. This also means
		// that any errors thrown in any nested relational changes will bubble up and cancel the whole
		// update tree
		type ItemValues = PrimaryKey
		| {
			primaryKey: PrimaryKey,

			actionHookPayload: any, // TODO better typing from processPayload()
			payloadAfterHooks: Partial<typeof data[number]>,
			payloadWithPresets: Partial<typeof data[number]>,
			payloadWithoutAliases: Pick<Partial<AnyItem>, string>,

			revisionsM2O: Awaited<ReturnType<PayloadService[`processM2O`]>>[`revisions`],
			revisionsA2O: Awaited<ReturnType<PayloadService[`processA2O`]>>[`revisions`],
			revisionsO2M?: Awaited<ReturnType<PayloadService[`processO2M`]>>[`revisions`],

			nestedActionEventsM2O: Awaited<ReturnType<PayloadService[`processM2O`]>>[`nestedActionEvents`],
			nestedActionEventsA2O: Awaited<ReturnType<PayloadService[`processA2O`]>>[`nestedActionEvents`],
			nestedActionEventsO2M?: Awaited<ReturnType<PayloadService[`processO2M`]>>[`nestedActionEvents`],

			userIntegrityCheckFlagsM2O: Awaited<ReturnType<PayloadService[`processM2O`]>>[`userIntegrityCheckFlags`],
			userIntegrityCheckFlagsA2O: Awaited<ReturnType<PayloadService[`processM2O`]>>[`userIntegrityCheckFlags`],
		}

		// If a PK of type number was provided, although the PK is set the auto_increment,
		// depending on the database, the sequence might need to be reset to protect future PK collisions.
		let autoIncrementSequenceNeedsToBeReset = false;

		const itemsValues: ItemValues[] = await this.knex.transaction(async (trx) => {
			// We're creating new services instances so they can use the transaction as their Knex interface
			const payloadService = new PayloadService(this.collection, {
				accountability: this.accountability,
				knex: trx,
				schema: this.schema,
			})

			const preparedItems: ItemValues[] = []

			for (const payloadToClone of data) {
				const payload = cloneDeep(payloadToClone)

				// Run all hooks that are attached to this event so the end user has the chance to augment the
				// item that is about to be saved
				const payloadAfterHooks =
					opts.emitEvents !== false
						? await emitter.emitFilter(
							this.eventScope === `items`
								? [`items.create`, `${this.collection}.items.create`]
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
						: payload

				if ( payloadAfterHooks === null) { // skip creation
					continue
				}

				if ( false // eslint-disable-line
					|| typeof payloadAfterHooks === 'string' // replace new creation by an existing item having a uuid as its primary key
					|| typeof payloadAfterHooks === 'number' // replace new creation by an existing item having a number as its primary key
				) {
					preparedItems.push(payloadAfterHooks)

					continue
				}

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
					throw opts.preMutationError
				}

				// Ensure the action hook payload has the post filter hook + preset changes
				const actionHookPayload = payloadWithPresets;

				// We're creating new services instances so they can use the transaction as their Knex interface
				const payloadService = new PayloadService(this.collection, {
					accountability: this.accountability,
					knex: trx,
					schema: this.schema,
					nested: this.nested,
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

				const payloadWithoutAliases = pick(payloadWithA2O, without(fields, ...aliases))
				const payloadWithTypeCasting = await payloadService.processValues(`create`, payloadWithoutAliases)

				// In case of manual string / UUID primary keys, the PK already exists in the object we're saving.
				const primaryKey = payloadWithTypeCasting[primaryKeyField]

				if (primaryKey) {
					validateKeys(this.schema, this.collection, primaryKeyField, primaryKey);
				}


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

				// batchInsertInput.push(payloadWithoutAliases)
				preparedItems.push({
					primaryKey,

					actionHookPayload,
					payloadAfterHooks,
					payloadWithPresets,
					payloadWithoutAliases,

					revisionsM2O,
					revisionsA2O,

					nestedActionEventsM2O,
					nestedActionEventsA2O,

					userIntegrityCheckFlagsM2O,
					userIntegrityCheckFlagsA2O,
				})
			}

			const itemsToInsert = preparedItems.filter(isNotPrimaryKey)





			const collectionSchema = this.schema.collections[this.collection]

			if (! collectionSchema) {
				throw new Error(`Can't find collection schema of ${this.collection}`)
			}

			const collectionFieldsSchema = collectionSchema.fields

			if (! collectionFieldsSchema) {
				throw new Error(`Can't find collection's fields schema of ${this.collection}`)
			}

			const isSqlite = this.knex.client.config.client === 'sqlite3'

			// Non nullable fields do not support "undefined" as value in batchInsert()
			// https://github.com/knex/knex/issues/332#issuecomment-2204047144
			const sqliteFieldsRequiringValue = isSqlite ? Object.fromEntries(
				Object.entries(collectionFieldsSchema)
				.filter(([fieldName, field]) => {
					return fieldName !== primaryKeyField
					&& field.nullable === false
				})
				.map(([fieldName, field]) => {
					return [fieldName, field.defaultValue]
				})
			) : {}


			try {
				let dbQuery = trx
				.batchInsert<Exclude<ItemValues, number | string>['payloadWithoutAliases']>(
					this.collection,
					itemsToInsert.map((v) => {
						return {
							...sqliteFieldsRequiringValue,
							...v.payloadWithoutAliases
						}
					})
				)
				.returning(primaryKeyField)


				dbQuery = (await emitter.emitFilter(
					['items.db.insert', `${this.collection}.db.insert`],
					dbQuery,
					{
						collection: this.collection,
						payload: data,
					},
					{
						database: trx,
						schema: this.schema,
						accountability: this.accountability,
					},
				)) as unknown as typeof dbQuery // TODO: fix emitFilter typing

				const results = await dbQuery;

				// MySQL, MariaDB and Sqlite will only return the id of the last item
				if (results.length === itemsToInsert.length) {

					const filteredResult = (await emitter.emitFilter(
						['items.db.inserted', `${this.collection}.db.inserted`],
						results,
						{
							collection: this.collection,
							payload: data,
						},
						{
							database: trx,
							schema: this.schema,
							accountability: this.accountability,
						},
					))


					filteredResult.forEach((result, index) => {
						const preparedValues = itemsToInsert[index]

						if (! preparedValues) {
							throw new Error(`No batchInsert itemInput found for index ${index}`) // Should never happend
						}

						// TODO .returning(primaryKeyField) should avoid this case
						const returnedKey = typeof result === `object` ? result[primaryKeyField] : result

						if (this.schema.collections[this.collection]!.fields[primaryKeyField]!.type === `uuid`) {
							preparedValues.primaryKey = getHelpers(trx).schema.formatUUID(
								(preparedValues.primaryKey ?? returnedKey) as string
							)
						}
						else {
							preparedValues.primaryKey = preparedValues.primaryKey ?? returnedKey
						}
					})
				}
				else {
					// Most database support returning, those who don't tend to return the PK anyways
					// (MySQL/SQLite). In case the primary key isn't know yet, we'll do a best-attempt at
					// fetching it based on the last inserted row


					// Fetching it with max should be safe, as we're in the context of the current transaction
					// const result = await trx.max(primaryKeyField, { as: `id` })
					// .first()
					// primaryKey = result.id

					// const inputKeys = Object.keys(itemsToInsert[0]!.payloadWithoutAliases)
					const inputKeys = [...new Set(itemsToInsert.map(item => {
						return Object.keys(item.payloadWithoutAliases)
					}).flat())].sort()

					const itemsToInsertWithoutPk = itemsToInsert.filter((item) => {
						return item.primaryKey === undefined
					})

					const itemsToInsertWithPk = itemsToInsert.filter((item) => {
						return item.primaryKey !== undefined && item.primaryKey !== null
					})

					// https://www.geeksforgeeks.org/sql/sql-query-to-get-the-latest-record-from-the-table/
					const lastRows = await trx.select(primaryKeyField, ...inputKeys)
					.from(this.collection)
					.orderBy(primaryKeyField, 'desc')
					.limit(itemsToInsertWithoutPk.length)

					// If some primary keys are given in the inputs and do not belong to the lastAddedRows (as ordered by id):
					// - It's not an issue because they are already set in itemsToInsert
					// - We need to jump them


					// TODO what if the id is specified but within the lastAddedRows?
					// console.log('!!!!! fetching missing pks', JSON.stringify({
					// 	itemsToInsert,
					// 	results,
					// 	lastAddedRows,
					// 	inputKeys,
					// 	// fieldTypes: collectionSchema.fields,
					// 	fieldTypes: Object.fromEntries( Object.entries(collectionSchema.fields).map(([fieldName, field]) => [fieldName, field.type])),
					// }, null, 2))

					const pkInInput = itemsToInsertWithPk.map(item => item.primaryKey)

					const lastAddedRows = lastRows.filter((addedRow) => {
						// If a fetched item already has an item, skip it as its order in the input may mismatch the fetched order (-by primary key)
						return ! pkInInput.includes(addedRow[primaryKeyField])
					})



					// TODO should this filter be before the fake .returning() behavior?
					const filteredLastAddedRows = (await emitter.emitFilter(
						['items.db.inserted', `${this.collection}.db.inserted`],
						lastAddedRows,
						{
							collection: this.collection,
							payload: data,
						},
						{
							database: trx,
							schema: this.schema,
							accountability: this.accountability,
						},
					))


					// const collectionSchema = this.schema.collections[this.collection]!.fields[primaryKeyField]!.type === `uuid`

					const emptyItemInput = Object.fromEntries(inputKeys.map(key => [key, undefined]))

					const isMariaDb = await this.isMariaDb()

					filteredLastAddedRows.map((addedRow, index) => {
						const itemIndex = itemsToInsertWithoutPk.length - 1 - index
						const item = itemsToInsertWithoutPk[itemIndex]

						if (item === undefined) {
							throw new Error(`Missing item to insert at ${itemIndex} during primary keys attribution for MySql / MariaDB / SQlite`) // should never happend
						}

						// The following check is overkill in production and may be replaced by proper testing
						// but it helped to ensure the Sqlite / MySQL / MariaDB work (even if I don't use them)
						// TODO
						// - Finish MySQL / Sqlite / MarioaDB support
						// - TEST
						//   - SQL DEFAULT
						//   - All the field types
						//   - pks in input with values OUTSIDE the select
						//   - pks in input with values INSIDE the select

						if (! [
							// TODO replace this condition by develop env?
							'mssql',
							// 'sqlite3'
						].includes(this.knex.client.config.client)) {
							const sqlifyEntries = <T extends Record<string, Primitive | Date>>(input: T) => {
								const entries = Object.entries(input)

								type SqlValue = string | number | null | JsonValue | Date

								const castedEntries = entries.reduce((acc, entry) => {
									const field = collectionSchema?.fields[entry[0]]

									if (! field) {
										throw new Error(`Field ${entry[0]} missing in the schema of the collection ${this.collection}`)
									}

									let value: SqlValue

									if (entry[1] === null || entry[1] === undefined) {
										// This must not be in the if else block as default values are not sql ones
										// e.g: default value can be "true" which must be casted as "1"
										entry[1] = field.defaultValue
									}

									if (entry[1] === null || entry[1] === undefined) {
										value = null
									}
									else if ('boolean' === field.type) {
										if (entry[1] === true) {
											value = 1
										}
										else if (entry[1] === false) {
											value = 0
										}
										else {
											throw new Error(`Invalid valid for boolean input: ${JSON.stringify(entry[1])}`)
										}
									}
									else if ([
										'string', 'text',
										'csv',
										'uuid',
										'time', // e.g. 00:00:00
									].includes(field.type)) {
										value = entry[1].toString()
									}
									else if ([
										'json',
									].includes(field.type)) {
										if (typeof entry[1] === 'string') {
											// TODO is it normal Json entries are not automatically parsed with MariaDb?
											value = isMariaDb ? entry[1] : JSON.parse(entry[1])
										}
										else {
											throw new Error(`Bad input value for JSON field: ${String(entry[1])}`)
										}
									}
									else if ([
										'timestamp',
										'date', 'dateTime',
									].includes(field.type)) {
										if (entry[1] instanceof Date) {
											if ( field.type === "timestamp"
												|| field.type === "dateTime"
											) {
												if (isMariaDb) {
													value = new Date( Math.floor(entry[1].getTime() / 1000) * 1000) // Flooring to seconds for MariaDb
												}
												else {
													value = new Date( Math.round(entry[1].getTime() / 1000) * 1000) // Rounding to seconds for Mysql
												}
											}
											else if (field.type === "date") {
												value = new Date(entry[1])
												value.setHours(0, 0, 0, 0)
											}
											else {
												// TODO throw error ?
												value = entry[1]
											}
										}
										else {
											throw new Error(`Unimplemented support for date/time input '${entry[0]}' having schema type '${field.type}' and value type ${typeof entry[1]}`)
										}
									}
									else if ([
										'integer', // example: primary key
										'float',
										'bigInteger',
									].includes(field.type)) {
										value = Number(entry[1])
									}
									else if ([
										'decimal',
									].includes(field.type)) {
										value = Number(entry[1]).toFixed(5)
									}
									else if (field.type === "alias") {
										throw new Error('Alias fields should already be removed here') //  as input is based on payloadWithoutAliases
									}
									else {
										// console.log('!!!!! fetching missing pks', JSON.stringify({
										// 	itemsToInsert,
										// 	results,
										// 	lastAddedRows,
										// 	inputKeys,
										// 	// fieldTypes: collectionSchema.fields,
										// 	fieldTypes: Object.fromEntries( Object.entries(collectionSchema.fields).map(([fieldName, field]) => [fieldName, field.type])),
										// 	fieldDefaults: Object.fromEntries( Object.entries(collectionSchema.fields).map(([fieldName, field]) => [fieldName, field.defaultValue])),
										// }, null, 2))

										throw new Error(`Unimplemented support for input entry '${entry[0]}' having schema type '${field.type}' and value type ${typeof entry[1]}`)
									}

									return [
										...acc,
										[
											entry[0],
											value,
										] as [string, SqlValue], // "as" avoids type conversion to SqlValue[]
									]
								}, [] as [string, SqlValue][])

								return Object.fromEntries(castedEntries) as Record<keyof T, SqlValue>
							}


							const sqlifiedItemInput = sqlifyEntries({
								[primaryKeyField]: addedRow[primaryKeyField],
								...emptyItemInput,
								...item.payloadWithoutAliases,
							})

							if (! isEqual(sqlifiedItemInput, addedRow)) {

								function objectDiff(obj1: Record<string, unknown>, obj2: Record<string, unknown>) {
									return reduce(obj1, (result, value, key) => {
										if (! isEqual(value, obj2[key])) {
											result[key] = { new: obj2[key], old: value };
										}

										return result;
									}, {} as Record<string, unknown>);
								}

								// console.log('!!!!! fetching missing pks', JSON.stringify({
								// 	// itemsToInsert,
								// 	itemsInputToInsert: itemsToInsert.map(i => i.payloadWithoutAliases),
								// 	results,
								// 	lastAddedRows,
								// 	inputKeys,
								// 	fieldTypes: Object.fromEntries( Object.entries(collectionSchema.fields).map(([fieldName, field]) => [fieldName, field.type])),
								// 	fieldDefaults: Object.fromEntries( Object.entries(collectionSchema.fields).map(([fieldName, field]) => [fieldName, field.defaultValue])),
								// }, null, 2))

								throw new Error(
									`Invalid primary key assignment of added row ${JSON.stringify(addedRow, null, 2)}`
									+ ` to inserted item ${JSON.stringify(sqlifiedItemInput, null, 2)}`
									+ ` differing by ${JSON.stringify(objectDiff(sqlifiedItemInput, addedRow), null, 2)}`
								)
							}
						}
					})

					filteredLastAddedRows.forEach((addedRow, index) => {
						const itemIndex = itemsToInsertWithoutPk.length - 1 - index
						const item = itemsToInsertWithoutPk[itemIndex]

						if (item === undefined) {
							throw new Error(`Missing item to insert at ${itemIndex} during primary keys attribution for MySql / MariaDB / SQlite`) // should never happend
						}

						item.primaryKey = addedRow.id

						// Set the primary key on the input item, in order for the "after" event hook to be able
						// to read from it
						item.payloadWithoutAliases[primaryKeyField] = item.primaryKey
						item.actionHookPayload[primaryKeyField] = item.primaryKey
					})


					const insertedItemsWithoutPk = itemsToInsert.filter((item) => {
						return item.primaryKey === undefined
					})

					if (insertedItemsWithoutPk.length !== 0) {
						throw new Error(`Remaining inserted items with no primary key: ${JSON.stringify(insertedItemsWithoutPk, null, 2)}`)
					}
				}
			}
			catch (err: any) {
				// console.log('Sql error', {
				// 	err,
				// 	data,
				// 	sqliteFieldsRequiringValue
				// })

				await throwDatabaseError(err, data)
			}


			// TODO should Promise.allSettled be replaced by a slower sequential await?
			const preparedForPostInsertProcessResponses = await Promise.allSettled( itemsToInsert.map(async (
				preparedItem
			) => {
				const {
					primaryKey,
					payloadAfterHooks,
					payloadWithPresets,
					revisionsM2O,
					revisionsA2O,
					userIntegrityCheckFlagsM2O,
					userIntegrityCheckFlagsA2O,
				} = preparedItem

				const {
					revisions: revisionsO2M,
					nestedActionEvents: nestedActionEventsO2M,
					userIntegrityCheckFlags: userIntegrityCheckFlagsO2M,
				} = await payloadService.processO2M(
					payloadWithPresets,
					primaryKey,
					opts
				)

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


				const activityInput = this.accountability
					&& this.schema.collections[this.collection]!.accountability !== null
				?	{
					action: Action.CREATE,
					user: this.accountability!.user,
					collection: this.collection,
					ip: this.accountability!.ip,
					user_agent: this.accountability!.userAgent,
					origin: this.accountability!.origin,
					item: primaryKey,
				}
				: undefined


				const revisionInput = activityInput !== undefined
					&& this.schema.collections[this.collection]!.accountability === `all`
				? await (async () => {
						const revisionDelta = await payloadService.prepareDelta(payloadAfterHooks)
						return {
							// activity, // will be added once activity rows are inserted
							collection: this.collection,
							item: primaryKey,
							data: revisionDelta,
							delta: revisionDelta,
						}
				})()
				: undefined

				let activity: PrimaryKey | undefined
				let revision: PrimaryKey | undefined

				return {
					...preparedItem,
					nestedActionEventsO2M,
					activityInput,
					activity,
					revisionInput,
					revision,
					childrenRevisions: [...revisionsM2O, ...revisionsA2O, ...revisionsO2M],
				}
			}))


			// TODO move them to a lib
			// From https://stackoverflow.com/a/69451755
			const isRejected = (input: PromiseSettledResult<unknown>): input is PromiseRejectedResult => {
				return input.status === 'rejected'
			}

			const isFulfilled = <T>(input: PromiseSettledResult<T>): input is PromiseFulfilledResult<T> => {
				return input.status === 'fulfilled'
			}

			const errorReasons = preparedForPostInsertProcessResponses.filter(isRejected)?.map(i => i.reason)

			if (errorReasons.length) {
				// console.log('errorReasons', errorReasons)
				throw errorReasons[0]
				// TODO how to pass all the errors ?
			}

			const preparedForPostInsert = preparedForPostInsertProcessResponses.filter(isFulfilled)?.map(item => item.value)


			const itemsWithActivityInput = preparedForPostInsert
			.filter(isNotPrimaryKey)
			.filter((item) => {
				return item.activityInput !== undefined
			})

			const { ActivityService } = await import('./activity.js');

			const itemsWithActivity = (await new ActivityService({
				knex: trx,
				schema: this.schema,
			})
			.createMany(itemsWithActivityInput.map((item) => {
				return item.activityInput!
			})))
			.map((activityPk, index) => {
				if (! (index in itemsWithActivityInput) || itemsWithActivityInput[index] === undefined) {
					throw new Error(`Unable to find '${index}' in activitiesItems`)
				}

				return {
					...itemsWithActivityInput[index],
					activity: activityPk,
				}
			})


			const itemsWithRevisionInput = itemsWithActivity
			.filter((item) => {
				return item.revisionInput !== undefined
			})

			const { RevisionsService } = await import('./revisions.js');

			const revisionsService = new RevisionsService({
				knex: trx,
				schema: this.schema,
			})

			const itemsWithActivityAndRevision =(await revisionsService.createMany(itemsWithRevisionInput.map((
				item
			) => {
				return {
					...item.revisionInput,
					activity: item.activity,
				}
			})))
			.map((revisionPk, index) => {
				if (! (index in itemsWithRevisionInput) || itemsWithRevisionInput[index] === undefined) {
					throw new Error(`Unable to find '${index}' in itemsWithRevisionInput`)
				}

				return {
					...itemsWithRevisionInput[index],
					revision: revisionPk,
				}
			})


			// Make sure to set the parent field of the child-revision rows
			const updateRevisionsChildrenResponses = await Promise.allSettled( itemsWithActivityAndRevision.map(async (item) => {
				if (item.childrenRevisions.length > 0) {
					await revisionsService.updateMany(item.childrenRevisions, { parent: item.revision })
				}

				if (opts.onRevisionCreate) {
					opts.onRevisionCreate(item.revision)
				}
			}))

			const revisionErrorReasons = updateRevisionsChildrenResponses.filter(isRejected)?.map(i => i.reason)

			if (revisionErrorReasons.length) {
				// console.log('revisionErrorReasons', revisionErrorReasons)
				throw revisionErrorReasons[0]
				// TODO how to pass all the errors ?
			}


			if (autoIncrementSequenceNeedsToBeReset) {
				await getHelpers(trx).sequence.resetAutoIncrementSequence(this.collection, primaryKeyField);
			}

			return preparedForPostInsert
		})


		for (const itemValues of itemsValues.filter(isNotPrimaryKey)) {
			if (opts.emitEvents === false) {
				continue
			}

			const {
				primaryKey,
				actionHookPayload,
				nestedActionEventsM2O,
				nestedActionEventsA2O,
				nestedActionEventsO2M,
			} = itemValues

			const actionEvent = {
				event:
					this.eventScope === `items`
						? [`items.create`, `${this.collection}.items.create`]
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
			}

			if (opts.bypassEmitAction) {
				await opts.bypassEmitAction(actionEvent)
			}
			else {
				await emitter.emitAction(actionEvent.event, actionEvent.meta, actionEvent.context)
			}

			const nestedActionEvents = [
				...nestedActionEventsO2M || [],
				...nestedActionEventsA2O,
				...nestedActionEventsM2O,
			]

			for (const nestedActionEvent of nestedActionEvents) {
				if (opts.bypassEmitAction) {
					await opts.bypassEmitAction(nestedActionEvent)
				}
				else {
					await emitter.emitAction(
						nestedActionEvent.event,
						nestedActionEvent.meta,
						nestedActionEvent.context
					)
				}
			}
		}

		if (shouldClearCache(this.cache, opts, this.collection)) {
			await this.cache.clear()
		}

		return itemsValues.map((itemValues) => {
			if (isPrimaryKey(itemValues)) {
				return itemValues
			}

			return itemValues.primaryKey
		})
	}

	/**
	 * Get items by query.
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
			throw new ForbiddenError(); // 404 / InvalidPayload ?
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
			await emitter.emitAction(
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
		validateKeys(this.schema, this.collection, primaryKeyField, key);

		const filterWithKey = assign({}, query.filter, { [primaryKeyField]: { _eq: key } });
		const queryWithKey = assign({}, query, { filter: filterWithKey });

		const results = await this.readByQuery(queryWithKey, opts);

		if (results.length === 0) {
			throw new ForbiddenError({
				// 404 / InvalidPayload?
				reason: `No result found for key ${key} in ${this.collection} during items.readOne()`,
				values: {
					accountability: this.accountability, // should accountability be considered here? 403 or 404?
					key,
				},
			});
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

		const results = await this.readByQuery(queryWithKey, opts);

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

				for (const item of data) {
					const primaryKey = item[primaryKeyField];
					if (!primaryKey) throw new InvalidPayloadError({ reason: `Item in update misses primary key` });

					const combinedOpts: MutationOptions = {
						autoPurgeCache: false,
						...opts,
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

		// TODO add null to payloadAfterHooks possible types
		const payloadKeys = Object.keys(payloadAfterHooks ?? {})

		if ( payloadKeys.length === 0 // payloadAfterHooks == {} || null
			|| (
				payloadKeys.length === 1
				&& payloadKeys[0] === primaryKeyField
			) // payloadAfterHooks == {id: xxx}
		) {
			return []
		}

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
					if (keys.length > 1) {
						await trx(this.collection).update(payloadWithTypeCasting).whereIn(primaryKeyField, keys);
					} else {
						await trx(this.collection).update(payloadWithTypeCasting).where(primaryKeyField, keys[0]);
					}
				} catch (err: any) {
					await throwDatabaseError(err, data);
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
				await opts.bypassEmitAction(actionEvent);
			} else {
				await emitter.emitAction(actionEvent.event, actionEvent.meta, actionEvent.context);
			}

			for (const nestedActionEvent of nestedActionEvents) {
				if (opts.bypassEmitAction) {
					await opts.bypassEmitAction(nestedActionEvent);
				} else {
					await emitter.emitAction(nestedActionEvent.event, nestedActionEvent.meta, nestedActionEvent.context);
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

			for (const payload of payloads) {
				const primaryKey = await service.upsertOne(payload, { ...(opts || {}), autoPurgeCache: false });
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

		const { ActivityService } = await import('./activity.js');

		const primaryKeyField = this.schema.collections[this.collection]!.primary;
		validateKeys(this.schema, this.collection, primaryKeyField, keys);

		if (this.accountability) {
			await validateAccess(
				{
					accountability: this.accountability,
					action: 'delete',
					collection: this.collection,
					primaryKeys: keys,
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
				},
			);
		}

		await transaction(this.knex, async (trx) => {
			await trx(this.collection).whereIn(primaryKeyField, keys).delete();

			if (opts.userIntegrityCheckFlags) {
				if (opts.onRequireUserIntegrityCheck) {
					opts.onRequireUserIntegrityCheck(opts.userIntegrityCheckFlags);
				} else {
					await validateUserCountIntegrity({ flags: opts.userIntegrityCheckFlags, knex: trx });
				}
			}

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
				await opts.bypassEmitAction(actionEvent);
			} else {
				await emitter.emitAction(actionEvent.event, actionEvent.meta, actionEvent.context);
			}
		}

		return keys;
	}

	/**
	 * Read/treat collection as singleton.
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
