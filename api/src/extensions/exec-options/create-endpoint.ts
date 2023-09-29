import express from 'express';
import { EXEC_CREATE_ENDPOINT } from "@directus/constants";
import { addExecOptions } from "../add-exec-options.js";
import env from '../../env.js';

export default addExecOptions(({ extensionManager, extension }) => {
	const scriptTimeoutMs = Number(env['EXTENSIONS_SECURE_TIMEOUT']);
	const endpointRouter = extensionManager.registration.endpointRouter;

	const scopedRouter = express.Router();
	endpointRouter.use(`/${extension.name}`, scopedRouter);

	async function createEndpoint(options: unknown) {

		const validOptions = EXEC_CREATE_ENDPOINT.parse(options);

		scopedRouter[<Lowercase<typeof validOptions.method>>validOptions.method.toLocaleLowerCase()](validOptions.path, async (req, res) => {
			const result = await validOptions.callback.apply(null, [{
				'url': req.url,
			}], {
				timeout: scriptTimeoutMs,
				arguments: {
					copy: true
				},
				result: {
					copy: true
				},
			});

			// TODO: Validate result

			res.json(result);
		});
	}

	return {
		'create-endpoint': createEndpoint,
	}
})
