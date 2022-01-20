import { schedule, validate } from 'node-cron';
import { omit } from 'lodash';
import getDatabase from './database';
import emitter from './emitter';
import logger from './logger';
import { FlowsService } from './services';
import { EventHandler } from './types';
import { getSchema } from './utils/get-schema';
import {
	OperationHandler,
	Operation,
	OperationRaw,
	Flow,
	FlowRaw,
	FilterHandler,
	ActionHandler,
	InitHandler,
} from '@directus/shared/types';

let flowManager: FlowManager | undefined;

export function getFlowManager(): FlowManager {
	if (flowManager) {
		return flowManager;
	}

	flowManager = new FlowManager();

	return flowManager;
}

const TRIGGER_KEY = '$trigger';
const LAST_KEY = '$last';

class FlowManager {
	private operations: Record<string, OperationHandler> = {};

	private triggerHandlers: EventHandler[] = [];

	public async initialize(): Promise<void> {
		const flowsService = new FlowsService({ knex: getDatabase(), schema: await getSchema() });

		const flows = await flowsService.readByQuery({
			filter: { status: { _eq: 'active' } },
			fields: ['*', 'operations.*'],
		});

		const flowTrees = flows.map((flow) => constructFlowTree(flow));

		for (const flow of flowTrees) {
			if (flow.trigger === 'filter') {
				const handler: FilterHandler = (payload, meta, context) => this.executeFlow(flow, { payload, meta, context });

				emitter.onFilter(flow.options.event, handler);

				this.triggerHandlers.push({ type: flow.trigger, name: flow.options.event, handler });
			} else if (flow.trigger === 'action') {
				const handler: ActionHandler = (meta, context) => this.executeFlow(flow, { meta, context });

				emitter.onAction(flow.options.event, handler);

				this.triggerHandlers.push({ type: flow.trigger, name: flow.options.event, handler });
			} else if (flow.trigger === 'init') {
				const handler: InitHandler = (meta) => this.executeFlow(flow, { meta });

				emitter.onInit(flow.options.event, handler);

				this.triggerHandlers.push({ type: flow.trigger, name: flow.options.event, handler });
			} else if (flow.trigger === 'schedule') {
				if (validate(flow.options.cron)) {
					const task = schedule(flow.options.cron, () => this.executeFlow(flow));

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

	public clearOperations(): void {
		this.operations = {};
	}

	private async executeFlow(flow: Flow, data: unknown = null): Promise<any> {
		const keyedData: Record<string, unknown> = { [TRIGGER_KEY]: data, [LAST_KEY]: data };

		let nextOperation = flow.operation;
		while (nextOperation !== null) {
			const { successor, data } = await this.executeOperation(nextOperation, keyedData);

			keyedData[nextOperation.key] = data;
			keyedData[LAST_KEY] = data;

			nextOperation = successor;
		}

		return keyedData[flow.options.return || TRIGGER_KEY];
	}

	private async executeOperation(
		operation: Operation,
		keyedData: Record<string, unknown>
	): Promise<{ successor: Operation | null; data: unknown }> {
		if (!(operation.type in this.operations)) {
			logger.warn(`Couldn't find operation ${operation.type}`);

			return { successor: null, data: null };
		}

		const handler = this.operations[operation.type];

		try {
			const result = await handler(keyedData, operation.options);

			return { successor: operation.resolve, data: result ?? null };
		} catch (error: unknown) {
			return { successor: operation.reject, data: error ?? null };
		}
	}
}

function constructFlowTree(flow: FlowRaw): Flow {
	const rootOperation = flow.operations.find((operation) => operation.id === flow.operation) ?? null;

	const operationTree = constructOperationTree(rootOperation, flow.operations);

	const flowTree: Flow = {
		...omit(flow, ['id', 'operations']),
		operation: operationTree,
	};

	return flowTree;
}

function constructOperationTree(root: OperationRaw | null, operations: OperationRaw[]): Operation | null {
	if (root === null) {
		return null;
	}

	const resolveOperation = root.resolve !== null ? operations.find((operation) => operation.id === root.resolve) : null;
	const rejectOperation = root.reject !== null ? operations.find((operation) => operation.id === root.reject) : null;

	if (resolveOperation === undefined || rejectOperation === undefined) {
		throw new Error('Undefined reference in operations');
	}

	const operationTree: Operation = {
		...omit(root, ['id', 'flow']),
		resolve: constructOperationTree(resolveOperation, operations),
		reject: constructOperationTree(rejectOperation, operations),
	};

	return operationTree;
}
