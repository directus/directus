import type { OperationHandler } from '@directus/extensions';
import type { PromiseCallback } from '@directus/types';
import type { Reference } from 'isolated-vm';
import { getFlowManager } from '../../../../flows.js';
import { callReference } from './call-reference.js';

export function registerOperationGenerator() {
	const flowManager = getFlowManager();

	const unregisterFunctions: PromiseCallback[] = [];

	const registerOperation = (
		id: Reference<string>,
		cb: Reference<(data: Record<string, unknown>) => unknown | Promise<unknown> | void>,
	) => {
		if (id.typeof !== 'string') throw new TypeError('Operation config id has to be of type string');
		if (cb.typeof !== 'function') throw new TypeError('Operation config handler has to be of type function');

		const idCopied = id.copySync();

		const handler: OperationHandler = async (data) => callReference(cb, [data]);

		flowManager.addOperation(idCopied, handler);

		unregisterFunctions.push(() => {
			flowManager.removeOperation(idCopied);
		});
	};

	return { register: registerOperation, unregisterFunctions };
}
