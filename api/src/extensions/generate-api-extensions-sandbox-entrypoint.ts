import type { ApiExtensionType, HybridExtensionType } from '@directus/extensions';
import { numberGenerator } from '@directus/utils';
import type { Router } from 'express';
import {
	registerActionGenerator,
	registerFilterGenerator,
	registerOperationGenerator,
	registerRouteGenerator,
} from './api-sandbox-registration.js';
import { generateHostFunctionReference } from './generate-host-function-reference.js';

export function generateApiExtensionsSandboxEntrypoint(
	type: ApiExtensionType | HybridExtensionType,
	name: string,
	endpointRouter: Router
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
					registerRoute(path, 'get', handler);
				},
				post: (path, handler) => {
					registerRoute(path, 'post', handler);
				},
				put: (path, handler) => {
					registerRoute(path, 'put', handler);
				},
				patch: (path, handler) => {
					registerRoute(path, 'patch', handler);
				},
				delete: (path, handler) => {
					registerRoute(path, 'delete', handler);
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

			const operationConfig = extensionExport(filter);

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
