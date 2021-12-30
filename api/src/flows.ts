import { schedule, ScheduledTask, validate } from 'node-cron';
import emitter from './emitter';
import logger from './logger';
import { ActionHandler, FilterHandler, InitHandler } from './types';

let flowManager: FlowManager | undefined;

export function getFlowManager(): FlowManager {
	if (flowManager) {
		return flowManager;
	}

	flowManager = new FlowManager();

	return flowManager;
}

const flows: Flow[] = [
	{
		name: 'test-action',
		status: 'active',
		trigger: 'action',
		options: {
			event: 'items.create',
		},
		operation: {
			type: 'debug',
			options: {
				message: 'Hello',
			},
			next: {
				type: 'debug',
				options: {
					message: 'World',
				},
				next: null,
				reject: null,
			},
			reject: null,
		},
	},
	{
		name: 'test-schedule',
		status: 'active',
		trigger: 'schedule',
		options: {
			cron: '*/15 * * * * *',
		},
		operation: {
			type: 'debug',
			options: {
				message: 'Surprise',
			},
			next: null,
			reject: {
				type: 'debug',
				options: {
					message: 'Oh no',
				},
				next: null,
				reject: null,
			},
		},
	},
];

type TriggerHandler =
	| { type: 'filter'; event: string; handler: FilterHandler }
	| { type: 'action'; event: string; handler: ActionHandler }
	| { type: 'init'; event: string; handler: InitHandler }
	| { type: 'schedule'; task: ScheduledTask };

class FlowManager {
	private operations: Record<string, OperationHandler> = {};

	private triggerHandlers: TriggerHandler[] = [];

	constructor() {
		this.addOperation('debug', (data, options) => {
			logger.info('DEBUG');
			logger.info(options);
		});
	}

	public async initialize(): Promise<void> {
		for (const flow of flows) {
			if (flow.status === 'active') {
				if (flow.trigger === 'filter') {
					const handler: FilterHandler = (payload, meta, context) =>
						this.executeOperation(flow.operation, { payload, meta, context });

					emitter.onFilter(flow.options.event, handler);

					this.triggerHandlers.push({ type: flow.trigger, event: flow.options.event, handler });
				} else if (flow.trigger === 'action') {
					const handler: ActionHandler = (meta, context) => this.executeOperation(flow.operation, { meta, context });

					emitter.onAction(flow.options.event, handler);

					this.triggerHandlers.push({ type: flow.trigger, event: flow.options.event, handler });
				} else if (flow.trigger === 'init') {
					const handler: InitHandler = (meta) => this.executeOperation(flow.operation, { meta });

					emitter.onInit(flow.options.event, handler);

					this.triggerHandlers.push({ type: flow.trigger, event: flow.options.event, handler });
				} else if (flow.trigger === 'schedule') {
					if (validate(flow.options.cron)) {
						const task = schedule(flow.options.cron, () => this.executeOperation(flow.operation));

						this.triggerHandlers.push({ type: flow.trigger, task });
					} else {
						logger.warn(`Couldn't register cron trigger. Provided cron is invalid: ${flow.options.cron}`);
					}
				}
			}
		}
	}

	public async reload(): Promise<void> {
		for (const trigger of this.triggerHandlers) {
			switch (trigger.type) {
				case 'filter':
					emitter.offFilter(trigger.event, trigger.handler);
					break;
				case 'action':
					emitter.offAction(trigger.event, trigger.handler);
					break;
				case 'init':
					emitter.offInit(trigger.event, trigger.handler);
					break;
				case 'schedule':
					trigger.task.stop();
					break;
			}
		}

		this.triggerHandlers = [];

		await this.initialize();
	}

	public addOperation(id: string, operation: OperationHandler): void {
		this.operations[id] = operation;
	}

	private async executeOperation(operation: FlowOperation | null, data: Record<string, any> = {}): Promise<any> {
		if (operation !== null) {
			if (operation.type in this.operations) {
				const handler = this.operations[operation.type];

				try {
					const result = await handler(data, operation.options);

					return this.executeOperation(operation.next, result ?? data);
				} catch {
					return this.executeOperation(operation.reject, data);
				}
			} else {
				logger.warn(`Couldn't find operation ${operation.type}`);
			}
		}

		return data;
	}
}

export type OperationHandler = (
	data: Record<string, any>,
	options: Record<string, any>
) => Record<string, any> | void | Promise<Record<string, any>> | Promise<void>;

export interface OperationApp {
	id: string;
	name: string;

	options: Record<string, any>;
}

export interface OperationApi {
	id: string;

	handler: OperationHandler;
}

type TriggerType = 'filter' | 'action' | 'init' | 'schedule';

export interface Flow {
	name: string;
	status: 'active' | 'inactive';
	trigger: TriggerType;
	options: Record<string, any>;
	operation: FlowOperation;
}

export interface FlowOperation {
	type: string;
	options: Record<string, any>;
	next: FlowOperation | null;
	reject: FlowOperation | null;
}

export interface FlowRaw {
	name: string;
	status: 'active' | 'inactive';
	trigger: TriggerType;
	options: Record<string, any>;
	operation: number;
}

export interface OperationRaw {
	type: string;
	options: Record<string, any>;
	next: number | null;
	reject: number | null;
}
