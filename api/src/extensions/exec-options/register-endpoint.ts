import express from 'express';
import { EXEC_REGISTER_ENDPOINT } from "@directus/constants";
import { addExecOptions } from "../utils/add-exec-options.js";
import { resumeIsolate } from '../utils/resume-isolate.js';
import type { Reference } from 'isolated-vm';
import { handlerAsReference } from '../utils/handler-as-reference.js';

export default addExecOptions((context) => {
	const { extensionManager, extension } = context
	const endpointRouter = extensionManager.registration.endpointRouter;

	const scopedRouter = express.Router();
	endpointRouter.use(`/${extension.name}`, scopedRouter);

	async function registerEndpoint(args: unknown[]) {

		handlerAsReference(EXEC_REGISTER_ENDPOINT);

		const [_, validOptions] = EXEC_REGISTER_ENDPOINT.parse(args);

		scopedRouter[<Lowercase<typeof validOptions.method>>validOptions.method.toLocaleLowerCase()](validOptions.path, async (req, res) => {
			const result = await resumeIsolate(context, validOptions.handler as unknown as Reference, [{
				'url': req.url,
			}])

			// TODO: Validate result

			res.json(result);
		})
	}

	extensionManager.registration.addUnregisterFunction(extension.name, () => {
		const emptyRouter = express.Router();
		endpointRouter.use(`/${extension.name}`, emptyRouter)
	})

	return {
		'register-endpoint': registerEndpoint,
	}
})
