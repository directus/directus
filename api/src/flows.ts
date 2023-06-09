import { Action, REDACTED_TEXT } from '@directus/constants';
import * as sharedExceptions from '@directus/exceptions';
import type {
	Accountability,
	ActionHandler,
	FilterHandler,
	Flow,
	Operation,
	OperationHandler,
	SchemaOverview,
} from '@directus/types';
import { applyOptionsData, isValidJSON, parseJSON, toArray } from '@directus/utils';
import type { Knex } from 'knex';
import { omit, pick } from 'lodash-es';
import { get } from 'micromustache';
import getDatabase from './database/index.js';
import emitter from './emitter.js';
import env from './env.js';
import * as exceptions from './exceptions/index.js';
import logger from './logger.js';
import { getMessenger } from './messenger.js';
import { ActivityService } from './services/activity.js';
import { FlowsService } from './services/flows.js';
import * as services from './services/index.js';
import { RevisionsService } from './services/revisions.js';
import type { EventHandler } from './types/index.js';
import { constructFlowTree } from './utils/construct-flow-tree.js';
import { getSchema } from './utils/get-schema.js';
import { JobQueue } from './utils/job-queue.js';
import { mapValuesDeep } from './utils/map-values-deep.js';
import { redact } from './utils/redact.js';
import { sanitizeError } from './utils/sanitize-error.js';
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

class FlowManager {
	private isLoaded = false;

	private operations: Record<string, OperationHandler> = {};

	private triggerHandlers: TriggerHandler[] = [];
	private operationFlowHandlers: Record<string, any> = {};
	private webhookFlowHandlers: Record<string, any> = {};

	private reloadQueue: JobQueue;

	constructor() {
		this.reloadQueue = new JobQueue();

		const messenger = getMessenger();

		messenger.subscribe('flows', (event) => {
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
		const messenger = getMessenger();

		messenger.publish('flows', { type: 'reload' });
	}

	public addOperation(id: string, operation: OperationHandler): void {
		this.operations[id] = operation;
	}

	public clearOperations(): void {
		this.operations = {};
	}

	public async runOperationFlow(id: string, data: unknown, context: Record<string, unknown>): Promise<unknown> {
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
		context: Record<string, unknown>
	): Promise<{ result: unknown; cacheEnabled?: boolean }> {
		if (!(id in this.webhookFlowHandlers)) {
			logger.warn(`Couldn't find webhook or manual triggered flow with id "${id}"`);
			throw new exceptions.ForbiddenException();
		}

		const handler = this.webhookFlowHandlers[id];

		return handler(data, context);
	}

	private async load(): Promise<void> {
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
									if (collection.startsWith('directus_')) {
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
							}
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
					const targetCollection = (data as Record<string, any>)?.['body'].collection;

					if (!targetCollection) {
						logger.warn(`Manual trigger requires "collection" to be specified in the payload`);
						throw new exceptions.ForbiddenException();
					}

					if (enabledCollections.length === 0) {
						logger.warn(`There is no collections configured for this manual trigger`);
						throw new exceptions.ForbiddenException();
					}

					if (!enabledCollections.includes(targetCollection)) {
						logger.warn(`Specified collection must be one of: ${enabledCollections.join(', ')}.`);
						throw new exceptions.ForbiddenException();
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
			[ENV_KEY]: pick(env, env['FLOWS_ENV_ALLOW_LIST'] ? toArray(env['FLOWS_ENV_ALLOW_LIST']) : []),
		};

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
						steps: steps,
						data: redact(
							omit(keyedData, '$accountability.permissions'), // Permissions is a ton of data, and is just a copy of what's in the directus_permissions table
							[
								['**', 'headers', 'authorization'],
								['**', 'headers', 'cookie'],
								['**', 'query', 'access_token'],
								['**', 'payload', 'password'],
							],
							REDACTED_TEXT
						),
					},
				});
			}
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
		context: Record<string, unknown> = {}
	): Promise<{
		successor: Operation | null;
		status: 'resolve' | 'reject' | 'unknown';
		data: unknown;
		options: Record<string, any> | null;
	}> {
		if (!(operation.type in this.operations)) {
			logger.warn(`Couldn't find operation ${operation.type}`);
			return { successor: null, status: 'unknown', data: null, options: null };
		}

		const handler = this.operations[operation.type]!;

		const options = applyOptionsData(operation.options, keyedData);

		try {
			let result = await handler(options, {
				services,
				exceptions: { ...exceptions, ...sharedExceptions },
				env,
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
				result = mapValuesDeep(result, (_, value) => (value === undefined ? null : value));
			}

			return { successor: operation.resolve, status: 'resolve', data: result ?? null, options };
		} catch (error) {
			let data;

			if (error instanceof Error) {
				// make sure we dont expose the stack trace
				data = sanitizeError(error);
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
