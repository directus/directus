import { Action } from '@directus/constants';
import { useEnv } from '@directus/env';
import { ForbiddenError } from '@directus/errors';
import { isSystemCollection } from '@directus/system-data';
import type {
	Accountability,
	ActionHandler,
	FilterHandler,
	Flow,
	Operation,
	PrimaryKey,
	SchemaOverview,
	OperationHandler,
} from '@directus/types';
import { applyOptionsData, deepMap, getRedactedString, isValidJSON, parseJSON, toArray } from '@directus/utils';
import type { Knex } from 'knex';
import { pick } from 'lodash-es';
import { get } from 'micromustache';
import { useBus } from './bus/index.js';
import getDatabase from './database/index.js';
import emitter from './emitter.js';
import { useLogger } from './logger/index.js';
import { fetchPermissions } from './permissions/lib/fetch-permissions.js';
import { fetchPolicies } from './permissions/lib/fetch-policies.js';
import { ActivityService } from './services/activity.js';
import { FlowsService } from './services/flows.js';
import * as services from './services/index.js';
import { RevisionsService } from './services/revisions.js';
import type { EventHandler } from './types/index.js';
import { constructFlowTree } from './utils/construct-flow-tree.js';
import { getSchema } from './utils/get-schema.js';
import { getService } from './utils/get-service.js';
import { JobQueue } from './utils/job-queue.js';
import { redactObject } from './utils/redact-object.js';
import { scheduleSynchronizedJob, validateCron } from './utils/schedule.js';

let flowManager: FlowManager | undefined;

export function getFlowManager(): FlowManager {
	if (flowManager) {
		return flowManager;
	}

	flowManager = new FlowManager();

	return flowManager;
}

type TriggerHandler = {
	id: string;
	events: EventHandler[];
};

const TRIGGER_KEY = '$trigger';
const ACCOUNTABILITY_KEY = '$accountability';
const LAST_KEY = '$last';
const ENV_KEY = '$env';

interface FlowMessage {
	type: 'reload';
}

class FlowManager {
	private isLoaded = false;

	private operations: Map<string, OperationHandler> = new Map();

	private triggerHandlers: TriggerHandler[] = [];
	private operationFlowHandlers: Record<string, any> = {};
	private webhookFlowHandlers: Record<string, any> = {};

	private reloadQueue: JobQueue;
	private envs: Record<string, any>;

	constructor() {
		const env = useEnv();
		const logger = useLogger();

		this.reloadQueue = new JobQueue();
		this.envs = env['FLOWS_ENV_ALLOW_LIST'] ? pick(env, toArray(env['FLOWS_ENV_ALLOW_LIST'] as string)) : {};

		const messenger = useBus();

		messenger.subscribe<FlowMessage>('flows', (event) => {
			if (event['type'] === 'reload') {
				this.reloadQueue.enqueue(async () => {
					if (this.isLoaded) {
						await this.unload();
						await this.load();
					} else {
						logger.warn('Flows have to be loaded before they can be reloaded');
					}
				});
			}
		});
	}

	public async initialize(): Promise<void> {
		if (!this.isLoaded) {
			await this.load();
		}
	}

	public async reload(): Promise<void> {
		const messenger = useBus();

		messenger.publish<FlowMessage>('flows', { type: 'reload' });
	}

	public addOperation(id: string, operation: OperationHandler): void {
		this.operations.set(id, operation);
	}

	public removeOperation(id: string): void {
		this.operations.delete(id);
	}

	public async runOperationFlow(id: string, data: unknown, context: Record<string, unknown>): Promise<unknown> {
		const logger = useLogger();

		if (!(id in this.operationFlowHandlers)) {
			logger.warn(`Couldn't find operation triggered flow with id "${id}"`);
			return null;
		}

		const handler = this.operationFlowHandlers[id];

		return handler(data, context);
	}

	public async runWebhookFlow(
		id: string,
		data: unknown,
		context: { schema: SchemaOverview; accountability: Accountability | undefined } & Record<string, unknown>,
	): Promise<{ result: unknown; cacheEnabled?: boolean }> {
		const logger = useLogger();

		if (!(id in this.webhookFlowHandlers)) {
			logger.warn(`Couldn't find webhook or manual triggered flow with id "${id}"`);
			throw new ForbiddenError();
		}

		const handler = this.webhookFlowHandlers[id];

		return handler(data, context);
	}

	private async load(): Promise<void> {
		const logger = useLogger();

		const flowsService = new FlowsService({ knex: getDatabase(), schema: await getSchema() });

		const flows = await flowsService.readByQuery({
			filter: { status: { _eq: 'active' } },
			fields: ['*', 'operations.*'],
			limit: -1,
		});

		const flowTrees = flows.map((flow) => constructFlowTree(flow));

		for (const flow of flowTrees) {
			if (flow.trigger === 'event') {
				let events: string[] = [];

				if (flow.options?.['scope']) {
					events = toArray(flow.options['scope'])
						.map((scope: string) => {
							if (['items.create', 'items.update', 'items.delete'].includes(scope)) {
								if (!flow.options?.['collections']) return [];

								return toArray(flow.options['collections']).map((collection: string) => {
									if (isSystemCollection(collection)) {
										const action = scope.split('.')[1];
										return collection.substring(9) + '.' + action;
									}

									return `${collection}.${scope}`;
								});
							}

							return scope;
						})
						.flat();
				}

				if (flow.options['type'] === 'filter') {
					const handler: FilterHandler = (payload, meta, context) =>
						this.executeFlow(
							flow,
							{ payload, ...meta },
							{
								accountability: context['accountability'],
								database: context['database'],
								getSchema: context['schema'] ? () => context['schema'] : getSchema,
							},
						);

					events.forEach((event) => emitter.onFilter(event, handler));

					this.triggerHandlers.push({
						id: flow.id,
						events: events.map((event) => ({ type: 'filter', name: event, handler })),
					});
				} else if (flow.options['type'] === 'action') {
					const handler: ActionHandler = (meta, context) =>
						this.executeFlow(flow, meta, {
							accountability: context['accountability'],
							database: getDatabase(),
							getSchema: context['schema'] ? () => context['schema'] : getSchema,
						});

					events.forEach((event) => emitter.onAction(event, handler));

					this.triggerHandlers.push({
						id: flow.id,
						events: events.map((event) => ({ type: 'action', name: event, handler })),
					});
				}
			} else if (flow.trigger === 'schedule') {
				if (validateCron(flow.options['cron'])) {
					const job = scheduleSynchronizedJob(flow.id, flow.options['cron'], async () => {
						try {
							await this.executeFlow(flow);
						} catch (error: any) {
							logger.error(error);
						}
					});

					this.triggerHandlers.push({ id: flow.id, events: [{ type: flow.trigger, job }] });
				} else {
					logger.warn(`Couldn't register cron trigger. Provided cron is invalid: ${flow.options['cron']}`);
				}
			} else if (flow.trigger === 'operation') {
				const handler = (data: unknown, context: Record<string, unknown>) => this.executeFlow(flow, data, context);

				this.operationFlowHandlers[flow.id] = handler;
			} else if (flow.trigger === 'webhook') {
				const method = flow.options?.['method'] ?? 'GET';

				const handler = async (data: unknown, context: Record<string, unknown>) => {
					let cacheEnabled = true;

					if (method === 'GET') {
						cacheEnabled = flow.options['cacheEnabled'] !== false;
					}

					if (flow.options['async']) {
						this.executeFlow(flow, data, context);
						return { result: undefined, cacheEnabled };
					} else {
						return { result: await this.executeFlow(flow, data, context), cacheEnabled };
					}
				};

				// Default return to $last for webhooks
				flow.options['return'] = flow.options['return'] ?? '$last';

				this.webhookFlowHandlers[`${method}-${flow.id}`] = handler;
			} else if (flow.trigger === 'manual') {
				const handler = async (data: unknown, context: Record<string, unknown>) => {
					const enabledCollections = flow.options?.['collections'] ?? [];
					const requireSelection = flow.options?.['requireSelection'] ?? true;
					const targetCollection = (data as Record<string, any>)?.['body'].collection;
					const targetKeys = (data as Record<string, any>)?.['body'].keys;

					if (!targetCollection) {
						logger.warn(`Manual trigger requires "collection" to be specified in the payload`);
						throw new ForbiddenError();
					}

					if (enabledCollections.length === 0) {
						logger.warn(`There is no collections configured for this manual trigger`);
						throw new ForbiddenError();
					}

					if (!enabledCollections.includes(targetCollection)) {
						logger.warn(`Specified collection must be one of: ${enabledCollections.join(', ')}.`);
						throw new ForbiddenError();
					}

					if (requireSelection && (!targetKeys || !Array.isArray(targetKeys))) {
						logger.warn(`Manual trigger requires "keys" to be specified in the payload`);
						throw new ForbiddenError();
					}

					if (requireSelection && targetKeys.length === 0) {
						logger.warn(`Manual trigger requires at least one key to be specified in the payload`);
						throw new ForbiddenError();
					}

					const accountability = context?.['accountability'] as Accountability | undefined;

					if (!accountability) {
						logger.warn(`Manual flows are only triggerable when authenticated`);
						throw new ForbiddenError();
					}

					if (accountability.admin === false) {
						const database = (context['database'] as Knex) ?? getDatabase();
						const schema = (context['schema'] as SchemaOverview) ?? (await getSchema({ database }));

						const policies = await fetchPolicies(accountability, { schema, knex: database });

						const permissions = await fetchPermissions(
							{
								policies,
								accountability,
								action: 'read',
								collections: [targetCollection],
							},
							{ schema, knex: database },
						);

						if (permissions.length === 0) {
							logger.warn(`Triggering ${targetCollection} is not allowed`);
							throw new ForbiddenError();
						}

						if (Array.isArray(targetKeys) && targetKeys.length > 0) {
							const service = getService(targetCollection, { schema, accountability, knex: database });
							const primaryField = schema.collections[targetCollection]!.primary;

							const keys = await service.readMany(
								targetKeys,
								{ fields: [primaryField] },
								{
									emitEvents: false,
								},
							);

							const allowedKeys: PrimaryKey[] = keys.map((key) => String(key[primaryField]));

							if (targetKeys.some((key: PrimaryKey) => !allowedKeys.includes(String(key)))) {
								logger.warn(`Triggering keys ${targetKeys} is not allowed`);
								throw new ForbiddenError();
							}
						}
					}

					if (flow.options['async']) {
						this.executeFlow(flow, data, context);
						return { result: undefined };
					} else {
						return { result: await this.executeFlow(flow, data, context) };
					}
				};

				// Default return to $last for manual
				flow.options['return'] = '$last';

				this.webhookFlowHandlers[`POST-${flow.id}`] = handler;
			}
		}

		this.isLoaded = true;
	}

	private async unload(): Promise<void> {
		for (const trigger of this.triggerHandlers) {
			for (const event of trigger.events) {
				switch (event.type) {
					case 'filter':
						emitter.offFilter(event.name, event.handler);
						break;
					case 'action':
						emitter.offAction(event.name, event.handler);
						break;
					case 'schedule':
						await event.job.stop();
						break;
				}
			}
		}

		this.triggerHandlers = [];
		this.operationFlowHandlers = {};
		this.webhookFlowHandlers = {};

		this.isLoaded = false;
	}

	private async executeFlow(flow: Flow, data: unknown = null, context: Record<string, unknown> = {}): Promise<unknown> {
		const database = (context['database'] as Knex) ?? getDatabase();
		const schema = (context['schema'] as SchemaOverview) ?? (await getSchema({ database }));

		const keyedData: Record<string, unknown> = {
			[TRIGGER_KEY]: data,
			[LAST_KEY]: data,
			[ACCOUNTABILITY_KEY]: context?.['accountability'] ?? null,
			[ENV_KEY]: this.envs,
		};

		context['flow'] ??= flow;

		let nextOperation = flow.operation;
		let lastOperationStatus: 'resolve' | 'reject' | 'unknown' = 'unknown';

		const steps: {
			operation: string;
			key: string;
			status: 'resolve' | 'reject' | 'unknown';
			options: Record<string, any> | null;
		}[] = [];

		while (nextOperation !== null) {
			const { successor, data, status, options } = await this.executeOperation(nextOperation, keyedData, context);

			keyedData[nextOperation.key] = data;
			keyedData[LAST_KEY] = data;
			lastOperationStatus = status;
			steps.push({ operation: nextOperation!.id, key: nextOperation.key, status, options });

			nextOperation = successor;
		}

		if (flow.accountability !== null) {
			const activityService = new ActivityService({
				knex: database,
				schema: schema,
			});

			const accountability = context?.['accountability'] as Accountability | undefined;

			const activity = await activityService.createOne({
				action: Action.RUN,
				user: accountability?.user ?? null,
				collection: 'directus_flows',
				ip: accountability?.ip ?? null,
				user_agent: accountability?.userAgent ?? null,
				origin: accountability?.origin ?? null,
				item: flow.id,
			});

			if (flow.accountability === 'all') {
				const revisionsService = new RevisionsService({
					knex: database,
					schema: schema,
				});

				await revisionsService.createOne({
					activity: activity,
					collection: 'directus_flows',
					item: flow.id,
					data: {
						steps: steps.map((step) => redactObject(step, { values: this.envs }, getRedactedString)),
						data: redactObject(
							keyedData,
							{
								keys: [
									['**', 'headers', 'authorization'],
									['**', 'headers', 'cookie'],
									['**', 'query', 'access_token'],
									['**', 'payload', 'password'],
								],
								values: this.envs,
							},
							getRedactedString,
						),
					},
				});
			}
		}

		if (
			(flow.trigger === 'manual' || flow.trigger === 'webhook') &&
			flow.options['async'] !== true &&
			flow.options['error_on_reject'] === true &&
			lastOperationStatus === 'reject'
		) {
			throw keyedData[LAST_KEY];
		}

		if (flow.trigger === 'event' && flow.options['type'] === 'filter' && lastOperationStatus === 'reject') {
			throw keyedData[LAST_KEY];
		}

		if (flow.options['return'] === '$all') {
			return keyedData;
		} else if (flow.options['return']) {
			return get(keyedData, flow.options['return']);
		}

		return undefined;
	}

	private async executeOperation(
		operation: Operation,
		keyedData: Record<string, unknown>,
		context: Record<string, unknown> = {},
	): Promise<{
		successor: Operation | null;
		status: 'resolve' | 'reject' | 'unknown';
		data: unknown;
		options: Record<string, any> | null;
	}> {
		const logger = useLogger();

		if (!this.operations.has(operation.type)) {
			logger.warn(`Couldn't find operation ${operation.type}`);

			return { successor: null, status: 'unknown', data: null, options: null };
		}

		const handler = this.operations.get(operation.type)!;

		let optionData = keyedData;

		if (operation.type === 'log') {
			optionData = redactObject(
				keyedData,
				{
					keys: [
						['**', 'headers', 'authorization'],
						['**', 'headers', 'cookie'],
						['**', 'query', 'access_token'],
						['**', 'payload', 'password'],
						['**', 'payload', 'token'],
						['**', 'payload', 'tfa_secret'],
						['**', 'payload', 'external_identifier'],
						['**', 'payload', 'auth_data'],
					],
				},
				getRedactedString,
			);
		}

		let options = operation.options;

		try {
			options = applyOptionsData(options, optionData);

			let result = await handler(options, {
				services,
				env: useEnv(),
				database: getDatabase(),
				logger,
				getSchema,
				data: keyedData,
				accountability: null,
				...context,
			});

			// Validate that the operations result is serializable and thus catching the error inside the flow execution
			JSON.stringify(result ?? null);

			// JSON structures don't allow for undefined values, so we need to replace them with null
			// Otherwise the applyOptionsData function will not work correctly on the next operation
			if (typeof result === 'object' && result !== null) {
				result = deepMap(result, (value) => (value === undefined ? null : value));
			}

			return { successor: operation.resolve, status: 'resolve', data: result ?? null, options };
		} catch (error) {
			let data;

			if (error instanceof Error) {
				// Don't expose the stack trace to the next operation
				delete error.stack;
				data = error;
			} else if (typeof error === 'string') {
				// If the error is a JSON string, parse it and use that as the error data
				data = isValidJSON(error) ? parseJSON(error) : error;
			} else {
				// If error is plain object, use this as the error data and otherwise fallback to null
				data = error ?? null;
			}

			return {
				successor: operation.reject,
				status: 'reject',
				data,
				options,
			};
		}
	}
}
