import type { Flow, FlowRaw, Operation, OperationRaw } from '@directus/types';
import { omit } from 'lodash-es';

export function constructFlowTree(flow: FlowRaw & { operations: OperationRaw[] }): Flow {
	const rootOperation = flow.operations.find((operation) => operation.id === flow.operation) ?? null;

	const operationTree = constructOperationTree(rootOperation, flow.operations);

	const flowTree: Flow = {
		...omit(flow, ['operations']),
		user_created: flow.user_created as any,
		operations: operationTree ? [operationTree] : [],
	};

	return flowTree;
}

function constructOperationTree(root: OperationRaw | null, operations: OperationRaw[]): Operation | null {
	if (root === null) {
		return null;
	}

	const resolveOperation = operations.find((operation) => operation.id === root.resolve) ?? null;
	const rejectOperation = operations.find((operation) => operation.id === root.reject) ?? null;

	const operationTree: Operation = {
		...root,
		user_created: root.user_created as any,
		resolve: constructOperationTree(resolveOperation, operations),
		reject: constructOperationTree(rejectOperation, operations),
	};

	return operationTree;
}
