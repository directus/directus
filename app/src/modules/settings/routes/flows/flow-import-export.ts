import type { FlowRaw, ImportCollectionData, OperationRaw } from '@directus/types';

type PortableFlow = Pick<
	FlowRaw,
	'id' | 'name' | 'icon' | 'color' | 'description' | 'trigger' | 'accountability' | 'options' | 'operation'
>;

type PortableOperation = Pick<
	OperationRaw,
	'id' | 'name' | 'key' | 'type' | 'position_x' | 'position_y' | 'options' | 'resolve' | 'reject' | 'flow'
>;

export type FlowExport = {
	version: 1;
	flow: PortableFlow;
	operations: PortableOperation[];
};

export function createFlowExport(flow: FlowRaw): FlowExport {
	return {
		version: 1,
		flow: {
			id: flow.id,
			name: flow.name,
			icon: flow.icon,
			color: flow.color,
			description: flow.description,
			trigger: flow.trigger,
			accountability: flow.accountability,
			options: flow.options,
			operation: flow.operation,
		},
		operations: (flow.operations ?? []).map((operation) => ({
			id: operation.id,
			name: operation.name,
			key: operation.key,
			type: operation.type,
			position_x: operation.position_x,
			position_y: operation.position_y,
			options: operation.options,
			resolve: operation.resolve,
			reject: operation.reject,
			flow: operation.flow,
		})),
	};
}

export function createFlowImport(value: unknown, folder: string | null = null): ImportCollectionData[] {
	const flowExport = validateFlowExport(value);

	return [
		{
			collection: 'directus_flows',
			items: [createImportFlow(flowExport.flow, folder)],
		},
		{
			collection: 'directus_operations',
			items: flowExport.operations.map(createImportOperation),
		},
	];
}

function createImportFlow(flow: PortableFlow, folder: string | null) {
	return {
		id: flow.id,
		folder,
		name: flow.name,
		icon: flow.icon,
		color: flow.color,
		description: flow.description,
		status: 'inactive',
		trigger: flow.trigger,
		accountability: flow.accountability,
		options: flow.options,
		operation: flow.operation,
	};
}

function createImportOperation(operation: PortableOperation) {
	return {
		id: operation.id,
		name: operation.name,
		key: operation.key,
		type: operation.type,
		position_x: operation.position_x,
		position_y: operation.position_y,
		options: operation.options,
		resolve: operation.resolve,
		reject: operation.reject,
		flow: operation.flow,
	};
}

function validateFlowExport(value: unknown): FlowExport {
	if (!isRecord(value) || value['version'] !== 1 || !isRecord(value['flow']) || !Array.isArray(value['operations'])) {
		throw new Error('Invalid Flow export file');
	}

	const flow = value['flow'];

	if (typeof flow['id'] !== 'string' || typeof flow['name'] !== 'string') {
		throw new Error('Invalid Flow export file');
	}

	const operationIds = new Set<string>();

	for (const operation of value['operations']) {
		if (!isRecord(operation) || typeof operation['id'] !== 'string' || typeof operation['key'] !== 'string') {
			throw new Error('Invalid Flow export file');
		}

		if (operation['flow'] !== flow['id']) {
			throw new Error('An operation belongs to a different Flow');
		}

		operationIds.add(operation['id']);
	}

	if (flow['operation'] !== null && (!isString(flow['operation']) || !operationIds.has(flow['operation']))) {
		throw new Error('Invalid Flow export file');
	}

	for (const operation of value['operations']) {
		const resolve = operation['resolve'];
		const reject = operation['reject'];

		if (
			(resolve !== null && (!isString(resolve) || !operationIds.has(resolve))) ||
			(reject !== null && (!isString(reject) || !operationIds.has(reject)))
		) {
			throw new Error('Invalid Flow export file');
		}
	}

	return value as FlowExport;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && Array.isArray(value) === false;
}

function isString(value: unknown): value is string {
	return typeof value === 'string';
}
