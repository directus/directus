import { addExecOptions } from "../utils/add-exec-options.js";
import { getFlowManager } from "../../flows.js";
import { EXEC_REGISTER_OPERATION } from "@directus/constants";
import { resumeIsolate } from "../utils/resume-isolate.js";

export default addExecOptions((context) => {
	const { extensionManager, extension } = context

	const flowManager = getFlowManager();


	async function createOperation(args: unknown[]) {

		const [_, validOptions] = EXEC_REGISTER_OPERATION.parse(args);

		flowManager.addOperation(validOptions.id, async (options, flowContext) => {
			const result = await resumeIsolate(context, validOptions.handler, [
				options,
				{ data: flowContext.data }
			])

			if (result instanceof Error) {
				throw result;
			}

			return result;
		});

		extensionManager.registration.addUnregisterFunction(extension.name, () => {
			flowManager.removeOperation(validOptions.id);
		})
	}

	return {
		'create-operation': createOperation,
	}
})
