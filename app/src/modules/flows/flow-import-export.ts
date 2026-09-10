import type { FlowRaw, ImportCollectionData, OperationRaw } from '@directus/types';

type PortableFlow = Pick<
	FlowRaw,
	'id' | 'name' | 'icon' | 'color' | 'description' | 'trigger' | 'accountability' | 'options' | 'operation'
>;

type PortableOperation = Pick<
	OperationRaw,
	'id' | 'name' | 'key' | 'type' | 'position_x' | 'position_y' | 'options' | 'resolve' | 'reject' | 'flow'
>;

type FlowBundle = {
	flow: PortableFlow;
	operations: PortableOperation[];
};

export type FlowExport = {
	version: 2;
	flows: FlowBundle[];
};

// The first release exported one Flow per file
type LegacyFlowExport = FlowBundle & { version: 1 };

/**
 * A file the user picked that isn't a usable Flow export. Carries a translation key so the caller can
 * tell the user what's wrong instead of falling back to the generic unexpected-error notice.
 */
export class FlowImportError extends Error {
	constructor(readonly translationKey: string) {
		super(translationKey);
		this.name = 'FlowImportError';
	}
}

export function parseFlowExport(contents: string): unknown {
	try {
		return JSON.parse(contents);
	} catch {
		throw new FlowImportError('flow_import_not_json');
	}
}

export function createFlowExport(flows: FlowRaw[]): FlowExport {
	return {
		version: 2,
		flows: flows.map((flow) => ({
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
		})),
	};
}

export function createFlowImport(value: unknown, folder: string | null = null): ImportCollectionData[] {
	const bundles = validateFlowExport(value);

	return [
		{
			collection: 'directus_flows',
			items: bundles.map((bundle) => createImportFlow(bundle.flow, folder)),
		},
		{
			collection: 'directus_operations',
			items: bundles.flatMap((bundle) => bundle.operations.map(createImportOperation)),
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

function validateFlowExport(value: unknown): FlowBundle[] {
	if (!isRecord(value)) throw new FlowImportError('flow_import_invalid_file');

	if (value['version'] === 1) return [validateFlowBundle(value as Partial<LegacyFlowExport>)];

	if (value['version'] === 2 && Array.isArray(value['flows'])) {
		return value['flows'].map(validateFlowBundle);
	}

	throw new FlowImportError('flow_import_invalid_file');
}

function validateFlowBundle(value: unknown): FlowBundle {
	if (!isRecord(value) || !isRecord(value['flow']) || !Array.isArray(value['operations'])) {
		throw new FlowImportError('flow_import_invalid_file');
	}

	const flow = value['flow'];

	if (typeof flow['id'] !== 'string' || typeof flow['name'] !== 'string') {
		throw new FlowImportError('flow_import_invalid_file');
	}

	const operationIds = new Set<string>();

	for (const operation of value['operations']) {
		if (!isRecord(operation) || typeof operation['id'] !== 'string' || typeof operation['key'] !== 'string') {
			throw new FlowImportError('flow_import_invalid_file');
		}

		if (operation['flow'] !== flow['id']) {
			throw new FlowImportError('flow_import_foreign_operation');
		}

		operationIds.add(operation['id']);
	}

	if (flow['operation'] !== null && (!isString(flow['operation']) || !operationIds.has(flow['operation']))) {
		throw new FlowImportError('flow_import_invalid_file');
	}

	return value as FlowBundle;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && Array.isArray(value) === false;
}

function isString(value: unknown): value is string {
	return typeof value === 'string';
}
