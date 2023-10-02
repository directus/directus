import express from 'express';
import { EXEC_CREATE_ENDPOINT } from "@directus/constants";
import { addExecOptions } from "../utils/add-exec-options.js";
import env from '../../env.js';

export default addExecOptions(({ extensionManager, extension }) => {
	const scriptTimeoutMs = Number(env['EXTENSIONS_SECURE_TIMEOUT']);
	const endpointRouter = extensionManager.registration.endpointRouter;

	const scopedRouter = express.Router();
	endpointRouter.use(`/${extension.name}`, scopedRouter);

	async function createEndpoint(options: unknown) {

		console.log("createEndpoint", options)

		const validOptions = EXEC_CREATE_ENDPOINT.parse(options);

		console.log("createEndpoint", validOptions)

		scopedRouter[<Lowercase<typeof validOptions.method>>validOptions.method.toLocaleLowerCase()](validOptions.path, async (req, res) => {
			const result = await validOptions.callback.apply(null, [{
				'url': req.url,
			}], {
				timeout: scriptTimeoutMs,
				arguments: {
					copy: true
				},
				result: {
					copy: true,
					promise: true
				},
			});

			// TODO: Validate result

			res.json(result);
		});
	}

	extensionManager.registration.addUnregisterFunction(extension.name, () => {
		const emptyRouter = express.Router();
		endpointRouter.use(`/${extension.name}`, emptyRouter)
	})

	return {
		'create-endpoint': createEndpoint,
	}
})
