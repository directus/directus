import express from 'express';
import { EXEC_REGISTER_ENDPOINT, EXEC_REGISTER_ENDPOINT_RESPONSE } from "@directus/constants";
import { addExecOptions } from "../utils/add-exec-options.js";
import { resumeIsolate } from '../utils/resume-isolate.js';
import type { Reference } from 'isolated-vm';
import { handlerAsReference } from '../utils/handler-as-reference.js';
import { isExtensionType } from '../utils/is-extension-type.js';

export default addExecOptions((context) => {
	const { extensionManager, extension } = context

	if (!isExtensionType(extension, 'endpoint')) return {};

	const endpointRouter = extensionManager.registration.endpointRouter;

	const scopedRouter = express.Router();
	endpointRouter.use(`/${extension.name}`, scopedRouter);

	async function registerEndpoint(args: unknown[]) {

		handlerAsReference(EXEC_REGISTER_ENDPOINT);

		const [_, validOptions] = EXEC_REGISTER_ENDPOINT.parse(args);

		scopedRouter[<Lowercase<typeof validOptions.method>>validOptions.method.toLocaleLowerCase()](validOptions.path, async (req, res) => {

			const result = await resumeIsolate(context, validOptions.handler as unknown as Reference, [{
				'url': req.url,
				'headers': req.headers,
				'body': req.body,
				'baseUrl': req.baseUrl,
			}])

			if (result instanceof Error) {
				res.status(500).json({
					'error': result.message,
				})

				return
			}

			const parsedResult = EXEC_REGISTER_ENDPOINT_RESPONSE.safeParse(result);

			if (!parsedResult.success) {
				res.status(500).json({
					'error': parsedResult.error,
				})

				return;
			}

			res.status(parsedResult.data.status).send(parsedResult.data.body);
		})
	}

	extensionManager.registration.addUnregisterFunction(extension.name, () => {
		endpointRouter.stack = endpointRouter.stack.filter((layer) => {
			console.log(layer)
			return !layer.path?.startsWith(`/${extension.name}`)
		})
	})

	return {
		'register-endpoint': registerEndpoint,
	}
})
