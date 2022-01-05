import { schedule, ScheduledTask, validate } from 'node-cron';
import { omit } from 'lodash';
import getDatabase from './database';
import emitter from './emitter';
import logger from './logger';
import { FlowsService } from './services';
import { ActionHandler, FilterHandler, InitHandler } from './types';
import { getSchema } from './utils/get-schema';

let flowManager: FlowManager | undefined;

export function getFlowManager(): FlowManager {
	if (flowManager) {
		return flowManager;
	}

	flowManager = new FlowManager();

	return flowManager;
}

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
		const flowsService = new FlowsService({ knex: getDatabase(), schema: await getSchema() });

		const flows = await flowsService.readByQuery({ filter: { status: { _eq: 'active' } }, fields: ['*.*'] });

		const flowTrees = flows.map((flow) => constructFlowTree(flow));

		for (const flow of flowTrees) {
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

	private async executeOperation(operation: Operation | null, data: Record<string, any> = {}): Promise<any> {
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

function constructFlowTree(flow: FlowRaw): Flow {
	if (flow.operations.length === 0)
		return {
			...omit(flow, ['id', 'operations']),
			operation: null,
		};

	const rootOperation = findRootOperation(flow.operations);
	const operationTree = constructOperationTree(rootOperation, flow.operations);

	const flowTree: Flow = {
		...omit(flow, ['id', 'operations']),
		operation: operationTree,
	};

	return flowTree;
}

function findRootOperation(operations: OperationRaw[]): OperationRaw {
	for (const operation of operations) {
		if (operations.every((other) => other.next !== operation.id && other.reject !== operation.id)) {
			return operation;
		}
	}

	throw new Error('Circular reference in operations!');
}

function constructOperationTree(root: OperationRaw, operations: OperationRaw[]): Operation {
	const nextOperation = root.next !== null ? operations.find((operation) => operation.id === root.next) : null;
	const rejectOperation = root.reject !== null ? operations.find((operation) => operation.id === root.reject) : null;

	if (nextOperation === undefined || rejectOperation === undefined) {
		throw new Error('Undefined reference in operations!');
	}

	const operationTree: Operation = {
		...omit(root, ['id', 'flow']),
		next: nextOperation !== null ? constructOperationTree(nextOperation, operations) : null,
		reject: rejectOperation !== null ? constructOperationTree(rejectOperation, operations) : null,
	};

	return operationTree;
}

export type OperationHandler = (
	data: Record<string, any>,
	options: Record<string, any>
) => Record<string, any> | void | Promise<Record<string, any>> | Promise<void>;

export interface OperationAppConfig {
	id: string;
	name: string;

	options: Record<string, any>;
}

export interface OperationApiConfig {
	id: string;

	handler: OperationHandler;
}

type TriggerType = 'filter' | 'action' | 'init' | 'schedule';

export interface Flow {
	name: string;
	icon: string;
	note: string;
	status: 'active' | 'inactive';
	trigger: TriggerType;
	options: Record<string, any>;
	operation: Operation | null;
}

export interface Operation {
	type: string;
	options: Record<string, any>;
	next: Operation | null;
	reject: Operation | null;
}

export interface FlowRaw {
	id: string;
	name: string;
	icon: string;
	note: string;
	status: 'active' | 'inactive';
	trigger: TriggerType;
	options: Record<string, any>;
	operations: OperationRaw[];
}

export interface OperationRaw {
	id: string;
	flow: string;
	type: string;
	options: Record<string, any>;
	next: string | null;
	reject: string | null;
}
