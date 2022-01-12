import { schedule, validate } from 'node-cron';
import { omit } from 'lodash';
import getDatabase from './database';
import emitter from './emitter';
import logger from './logger';
import { FlowsService } from './services';
import {
	ActionHandler,
	EventHandler,
	FilterHandler,
	Flow,
	FlowRaw,
	InitHandler,
	Operation,
	OperationRaw,
} from './types';
import { getSchema } from './utils/get-schema';
import { OperationHandler } from '@directus/shared/types';

let flowManager: FlowManager | undefined;

export function getFlowManager(): FlowManager {
	if (flowManager) {
		return flowManager;
	}

	flowManager = new FlowManager();

	return flowManager;
}

class FlowManager {
	private operations: Record<string, OperationHandler> = {};

	private triggerHandlers: EventHandler[] = [];

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

				this.triggerHandlers.push({ type: flow.trigger, name: flow.options.event, handler });
			} else if (flow.trigger === 'action') {
				const handler: ActionHandler = (meta, context) => this.executeOperation(flow.operation, { meta, context });

				emitter.onAction(flow.options.event, handler);

				this.triggerHandlers.push({ type: flow.trigger, name: flow.options.event, handler });
			} else if (flow.trigger === 'init') {
				const handler: InitHandler = (meta) => this.executeOperation(flow.operation, { meta });

				emitter.onInit(flow.options.event, handler);

				this.triggerHandlers.push({ type: flow.trigger, name: flow.options.event, handler });
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
					emitter.offFilter(trigger.name, trigger.handler);
					break;
				case 'action':
					emitter.offAction(trigger.name, trigger.handler);
					break;
				case 'init':
					emitter.offInit(trigger.name, trigger.handler);
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
