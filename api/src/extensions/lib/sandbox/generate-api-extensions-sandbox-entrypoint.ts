import type { ApiExtensionType, HybridExtensionType } from '@directus/extensions';
import { numberGenerator } from '@directus/utils';
import type { Router } from 'express';
import { generateHostFunctionReference } from './generate-host-function-reference.js';
import {
	registerActionGenerator,
	registerFilterGenerator,
	registerOperationGenerator,
	registerRouteGenerator,
} from './register/index.js';

/**
 * Generate the JS to run in the isolate to create the extension's entrypoint to the host
 *
 * @param type - Extension type to generate the entrypoint for
 * @param name - Unique name of the extension
 * @param endpointRouter - Scoped express router to register endpoint extension in
 */
export function generateApiExtensionsSandboxEntrypoint(
	type: ApiExtensionType | HybridExtensionType,
	name: string,
	endpointRouter: Router,
) {
	const index = numberGenerator();

	const hostFunctions = [];

	const extensionExport = `const extensionExport = $${index.next().value}.deref();`;

	if (type === 'hook') {
		const code = `
			${extensionExport}

			const filter = ${generateHostFunctionReference(index, ['event', 'handler'], { async: false })}
			const action = ${generateHostFunctionReference(index, ['event', 'handler'], { async: false })}

			return extensionExport({ filter, action });
		`;

		const { register: filter, unregisterFunctions: filterUnregisterFunctions } = registerFilterGenerator();
		const { register: action, unregisterFunctions: actionUnregisterFunctions } = registerActionGenerator();

		hostFunctions.push(filter);
		hostFunctions.push(action);

		const unregisterFunction = async () => {
			await Promise.all([...filterUnregisterFunctions, ...actionUnregisterFunctions].map((fn) => fn()));
		};

		return { code, hostFunctions, unregisterFunction };
	} else if (type === 'endpoint') {
		const code = `
			${extensionExport}

			const registerRoute = ${generateHostFunctionReference(index, ['path', 'method', 'handler'], { async: false })}

			const router = {
				get: (path, handler) => {
					registerRoute(path, 'GET', handler);
				},
				post: (path, handler) => {
					registerRoute(path, 'POST', handler);
				},
				put: (path, handler) => {
					registerRoute(path, 'PUT', handler);
				},
				patch: (path, handler) => {
					registerRoute(path, 'PATCH', handler);
				},
				delete: (path, handler) => {
					registerRoute(path, 'DELETE', handler);
				}
			};

			return extensionExport(router);
		`;

		const { register, unregisterFunction } = registerRouteGenerator(name, endpointRouter);

		hostFunctions.push(register);

		return { code, hostFunctions, unregisterFunction };
	} else {
		const code = `
			${extensionExport}

			const registerOperation = ${generateHostFunctionReference(index, ['id', 'handler'], { async: false })}

			const operationConfig = extensionExport();

			registerOperation(operationConfig.id, operationConfig.handler);
		`;

		const { register, unregisterFunctions } = registerOperationGenerator();

		hostFunctions.push(register);

		const unregisterFunction = async () => {
			await Promise.all(unregisterFunctions.map((fn) => fn()));
		};

		return { code, hostFunctions, unregisterFunction };
	}
}
