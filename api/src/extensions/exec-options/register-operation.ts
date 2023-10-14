import type { Reference } from 'isolated-vm';
import { getFlowManager } from '../../flows.js';
import { addExecOptions } from '../utils/add-exec-options.js';
import { handlerAsReference } from '../utils/handler-as-reference.js';
import { resumeIsolate } from '../utils/resume-isolate.js';
import { EXEC_REGISTER_OPERATION, EXEC_REGISTER_OPERATION_RESPONSE } from '../validation/register-operation.js';

export default addExecOptions((context) => {
	const { extensionManager, extension } = context;

	// @TODO: Fix extension typecheck
	// if (!isExtensionType(extension, 'operation')) return {};

	const flowManager = getFlowManager();

	async function createOperation(args: unknown[]) {
		handlerAsReference(EXEC_REGISTER_OPERATION);

		const [_, validOptions] = EXEC_REGISTER_OPERATION.parse(args);

		flowManager.addOperation(validOptions.id, async (options, flowContext) => {
			const result = await resumeIsolate(context, validOptions.handler as unknown as Reference, [
				options,
				{ data: flowContext.data },
			]);

			if (result instanceof Error) {
				throw result;
			}

			const parsedResult = EXEC_REGISTER_OPERATION_RESPONSE.parse(result);

			return parsedResult;
		});

		extensionManager.registration.addUnregisterFunction(extension.name, () => {
			flowManager.removeOperation(validOptions.id);
		});
	}

	return {
		'register-operation': createOperation,
	};
});
