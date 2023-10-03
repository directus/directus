import express from 'express';
import { EXEC_CREATE_ENDPOINT } from "@directus/constants";
import { addExecOptions } from "../utils/add-exec-options.js";
import { resumeIsolate } from '../utils/resume-isolate.js';

export default addExecOptions((context) => {
	const { extensionManager, extension } = context
	const endpointRouter = extensionManager.registration.endpointRouter;

	const scopedRouter = express.Router();
	endpointRouter.use(`/${extension.name}`, scopedRouter);

	async function createEndpoint(options: unknown) {
		const validOptions = EXEC_CREATE_ENDPOINT.parse(options);

		scopedRouter[<Lowercase<typeof validOptions.method>>validOptions.method.toLocaleLowerCase()](validOptions.path, async (req, res) => {
			const result = await resumeIsolate(context, validOptions.callback, [{
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
		'create-endpoint': createEndpoint,
	}
})
