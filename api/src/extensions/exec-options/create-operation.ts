import { addExecOptions } from "../add-exec-options.js";
import env from '../../env.js';
import { getFlowManager } from "../../flows.js";
import { EXEC_CREATE_OPERATION } from "@directus/constants";

export default addExecOptions(() => {
	const scriptTimeoutMs = Number(env['EXTENSIONS_SECURE_TIMEOUT']);

	const flowManager = getFlowManager();


	async function createOperation(options: unknown) {

		const validOptions = EXEC_CREATE_OPERATION.parse(options);

		flowManager.addOperation(validOptions.id, async (options, flowContext) => {
			const result = await validOptions.handler.apply(null, [
				options,
				{ data: flowContext.data }
			], {
				timeout: scriptTimeoutMs,
				arguments: {
					copy: true
				},
			});

			if (result instanceof Error) {
				throw result;
			}

			return result;
		});
	}

	return {
		'create-operation': createOperation,
	}
})
