import type { Flow, FlowRaw, Operation, OperationRaw } from '@directus/types';
import { omit } from 'lodash-es';

export function constructFlowTree(flow: FlowRaw): Flow {
	const rootOperation = flow.operations.find((operation) => operation.id === flow.operation) ?? null;

	const operationTree = constructOperationTree(rootOperation, flow.operations);

	const flowTree: Flow = {
		...omit(flow, 'operations'),
		operation: operationTree,
		options: flow.options ?? {},
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
		...omit(root, 'flow'),
		resolve: constructOperationTree(resolveOperation, operations),
		reject: constructOperationTree(rejectOperation, operations),
	};

	return operationTree;
}
