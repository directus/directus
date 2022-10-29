import * as sharedExceptions from '@directus/shared/exceptions';
import {
	Accountability,
	Action,
	ActionHandler,
	FilterHandler,
	Flow,
	Operation,
	OperationHandler,
	SchemaOverview,
} from '@directus/shared/types';
import { applyOptionsData, toArray } from '@directus/shared/utils';
import fastRedact from 'fast-redact';
import { Knex } from 'knex';
import { omit, pick } from 'lodash';
import { get } from 'micromustache';
import { schedule, validate } from 'node-cron';
import getDatabase from './database';
import emitter from './emitter';
import env from './env';
import * as exceptions from './exceptions';
import logger from './logger';
import { getMessenger } from './messenger';
import * as services from './services';
import { FlowsService } from './services';
import { ActivityService } from './services/activity';
import { RevisionsService } from './services/revisions';
import { EventHandler } from './types';
import { constructFlowTree } from './utils/construct-flow-tree';
import { getSchema } from './utils/get-schema';
import { JobQueue } from './utils/job-queue';

let flowManager: FlowManager | undefined;

const redactLogs = fastRedact({
	censor: '--redacted--',
	paths: ['*.headers.authorization', '*.access_token', '*.headers.cookie'],
	serialize: false,
});

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
			if (event.type === 'reload') {
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

	public async runWebhookFlow(id: string, data: unknown, context: Record<string, unknown>): Promise<unknown> {
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
				const events: string[] = flow.options?.scope
					? toArray(flow.options.scope)
							.map((scope: string) => {
								if (['items.create', 'items.update', 'items.delete'].includes(scope)) {
									return (
										flow.options?.collections?.map((collection: string) => {
											if (collection.startsWith('directus_')) {
												const action = scope.split('.')[1];
												return collection.substring(9) + '.' + action;
											}

											return `${collection}.${scope}`;
										}) ?? []
									);
								}

								return scope;
							})
							.flat()
					: [];

				if (flow.options.type === 'filter') {
					const handler: FilterHandler = (payload, meta, context) =>
						this.executeFlow(
							flow,
							{ payload, ...meta },
							{
								accountability: context.accountability,
								database: context.database,
								getSchema: context.schema ? () => context.schema : getSchema,
							}
						);

					events.forEach((event) => emitter.onFilter(event, handler));
					this.triggerHandlers.push({
						id: flow.id,
						events: events.map((event) => ({ type: 'filter', name: event, handler })),
					});
				} else if (flow.options.type === 'action') {
					const handler: ActionHandler = (meta, context) =>
						this.executeFlow(flow, meta, {
							accountability: context.accountability,
							database: getDatabase(),
							getSchema: context.schema ? () => context.schema : getSchema,
						});

					events.forEach((event) => emitter.onAction(event, handler));
					this.triggerHandlers.push({
						id: flow.id,
						events: events.map((event) => ({ type: 'action', name: event, handler })),
					});
				}
			} else if (flow.trigger === 'schedule') {
				if (validate(flow.options.cron)) {
					const task = schedule(flow.options.cron, async () => {
						try {
							await this.executeFlow(flow);
						} catch (error: any) {
							logger.error(error);
						}
					});

					this.triggerHandlers.push({ id: flow.id, events: [{ type: flow.trigger, task }] });
				} else {
					logger.warn(`Couldn't register cron trigger. Provided cron is invalid: ${flow.options.cron}`);
				}
			} else if (flow.trigger === 'operation') {
				const handler = (data: unknown, context: Record<string, unknown>) => this.executeFlow(flow, data, context);

				this.operationFlowHandlers[flow.id] = handler;
			} else if (flow.trigger === 'webhook') {
				const handler = (data: unknown, context: Record<string, unknown>) => {
					if (flow.options.async) {
						this.executeFlow(flow, data, context);
					} else {
						return this.executeFlow(flow, data, context);
					}
				};

				const method = flow.options?.method ?? 'GET';

				// Default return to $last for webhooks
				flow.options.return = flow.options.return ?? '$last';

				this.webhookFlowHandlers[`${method}-${flow.id}`] = handler;
			} else if (flow.trigger === 'manual') {
				const handler = (data: unknown, context: Record<string, unknown>) => {
					const enabledCollections = flow.options?.collections ?? [];
					const targetCollection = (data as Record<string, any>)?.body.collection;

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

					if (flow.options.async) {
						this.executeFlow(flow, data, context);
					} else {
						return this.executeFlow(flow, data, context);
					}
				};

				// Default return to $last for manual
				flow.options.return = '$last';

				this.webhookFlowHandlers[`POST-${flow.id}`] = handler;
			}
		}

		this.isLoaded = true;
	}

	private async unload(): Promise<void> {
		for (const trigger of this.triggerHandlers) {
			trigger.events.forEach((event) => {
				switch (event.type) {
					case 'filter':
						emitter.offFilter(event.name, event.handler);
						break;
					case 'action':
						emitter.offAction(event.name, event.handler);
						break;
					case 'schedule':
						event.task.stop();
						break;
				}
			});
		}

		this.triggerHandlers = [];
		this.operationFlowHandlers = {};
		this.webhookFlowHandlers = {};

		this.isLoaded = false;
	}

	private async executeFlow(flow: Flow, data: unknown = null, context: Record<string, unknown> = {}): Promise<unknown> {
		const database = (context.database as Knex) ?? getDatabase();
		const schema = (context.schema as SchemaOverview) ?? (await getSchema({ database }));

		const keyedData: Record<string, unknown> = {
			[TRIGGER_KEY]: data,
			[LAST_KEY]: data,
			[ACCOUNTABILITY_KEY]: context?.accountability ?? null,
			[ENV_KEY]: pick(env, env.FLOWS_ENV_ALLOW_LIST ? toArray(env.FLOWS_ENV_ALLOW_LIST) : []),
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

			const accountability = context?.accountability as Accountability | undefined;

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
						data: redactLogs(omit(keyedData, '$accountability.permissions')), // Permissions is a ton of data, and is just a copy of what's in the directus_permissions table
					},
				});
			}
		}

		if (flow.trigger === 'event' && flow.options.type === 'filter' && lastOperationStatus === 'reject') {
			throw keyedData[LAST_KEY];
		}

		if (flow.options.return === '$all') {
			return keyedData;
		} else if (flow.options.return) {
			return get(keyedData, flow.options.return);
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

		const handler = this.operations[operation.type];

		const options = applyOptionsData(operation.options, keyedData);

		try {
			const result = await handler(options, {
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

			return { successor: operation.resolve, status: 'resolve', data: result ?? null, options };
		} catch (error: unknown) {
			return { successor: operation.reject, status: 'reject', data: error ?? null, options };
		}
	}
}
