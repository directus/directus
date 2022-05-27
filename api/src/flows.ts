import * as sharedExceptions from '@directus/shared/exceptions';
import {
	ActionHandler,
	FilterHandler,
	Flow,
	Operation,
	OperationHandler,
	SchemaOverview,
	Accountability,
	Action,
} from '@directus/shared/types';
import { get } from 'micromustache';
import { schedule, validate } from 'node-cron';
import getDatabase from './database';
import emitter from './emitter';
import env from './env';
import * as exceptions from './exceptions';
import logger from './logger';
import * as services from './services';
import { FlowsService } from './services';
import { EventHandler } from './types';
import { constructFlowTree } from './utils/construct-flow-tree';
import { getSchema } from './utils/get-schema';
import { renderMustache } from './utils/render-mustache';
import { ActivityService } from './services/activity';
import { RevisionsService } from './services/revisions';
import { Knex } from 'knex';
import { omit } from 'lodash';

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

class FlowManager {
	private operations: Record<string, OperationHandler> = {};

	private triggerHandlers: TriggerHandler[] = [];
	private operationFlowHandlers: Record<string, any> = {};
	private webhookFlowHandlers: Record<string, any> = {};

	private flowOperations: Record<string, any> = {};

	public async initialize(): Promise<void> {
		const flowsService = new FlowsService({ knex: getDatabase(), schema: await getSchema() });

		const flows = await flowsService.readByQuery({
			filter: { status: { _eq: 'active' } },
			fields: ['*', 'operations.*'],
		});

		for (const flow of flows) {
			for (const operationRaw of flow.operations) {
				const operation = {
					...operationRaw,
					resolve: null,
					reject: null,
				};

				const handler = (data: Record<string, unknown>) => this.executeOperation(operation, data);

				this.flowOperations[operation.id] = handler;
			}
		}

		const flowTrees = flows.map((flow) => constructFlowTree(flow));

		for (const flow of flowTrees) {
			if (flow.trigger === 'hook') {
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

					const events: string[] =
						flow.options?.filterScope
							?.map((scope: string) => {
								if (['items.create', 'items.update', 'items.delete'].includes(scope)) {
									return (
										flow.options?.filterCollections?.map((collection: string) => {
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
							?.flat() ?? [];

					events.forEach((event) => emitter.onFilter(event, handler));
					this.triggerHandlers.push({
						id: flow.id,
						events: events.map((event) => ({ type: 'filter', name: event, handler })),
					});
				}

				if (flow.options.type === 'action') {
					const handler: ActionHandler = (meta, context) =>
						this.executeFlow(flow, meta, {
							accountability: context.accountability,
							database: context.database,
							getSchema: context.schema ? () => context.schema : getSchema,
						});

					const events: string[] =
						flow.options?.actionScope
							?.map((scope: string) => {
								if (['items.create', 'items.update', 'items.delete'].includes(scope)) {
									return (
										flow.options?.actionCollections?.map((collection: string) => {
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
							?.flat() ?? [];

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
			} else if (flow.trigger === 'webhook' || flow.trigger === 'manual') {
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
			}
		}
	}

	public async reload(): Promise<void> {
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

		this.flowOperations = {};

		await this.initialize();
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
			logger.warn(`Couldn't find webhook triggered flow with id "${id}"`);
			throw new exceptions.ForbiddenException();
		}

		const handler = this.webhookFlowHandlers[id];

		return handler(data, context);
	}

	public async runOperation(id: string, data: unknown): Promise<unknown> {
		if (!(id in this.flowOperations)) {
			logger.warn(`Couldn't find operation with id "${id}"`);

			return null;
		}

		const handler = this.flowOperations[id];

		return handler(data);
	}

	private async executeFlow(flow: Flow, data: unknown = null, context: Record<string, unknown> = {}): Promise<unknown> {
		const database = (context.database as Knex) ?? getDatabase();
		const schema = (context.schema as SchemaOverview) ?? (await getSchema({ database }));

		const keyedData: Record<string, unknown> = {
			[TRIGGER_KEY]: data,
			[LAST_KEY]: data,
			[ACCOUNTABILITY_KEY]: context?.accountability ?? null,
		};

		let nextOperation = flow.operation;

		const statuses: { operation: string; key: string; status: 'resolve' | 'reject' | 'unknown' }[] = [];

		while (nextOperation !== null) {
			const { successor, data, status } = await this.executeOperation(nextOperation, keyedData, context);

			keyedData[nextOperation.key] = data;
			keyedData[LAST_KEY] = data;
			statuses.push({ operation: nextOperation!.id, key: nextOperation.key, status });

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
						status: statuses,
						data: omit(keyedData, '$accountability.permissions'), // Permissions is a ton of data, and is just a copy of what's in the directus_permissions table
					},
				});
			}
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
	): Promise<{ successor: Operation | null; status: 'resolve' | 'reject' | 'unknown'; data: unknown }> {
		if (!(operation.type in this.operations)) {
			logger.warn(`Couldn't find operation ${operation.type}`);
			return { successor: null, status: 'unknown', data: null };
		}

		const handler = this.operations[operation.type];

		const options = renderMustache(operation.options, keyedData);

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

			return { successor: operation.resolve, status: 'resolve', data: result ?? null };
		} catch (error: unknown) {
			return { successor: operation.reject, status: 'reject', data: error ?? null };
		}
	}
}
