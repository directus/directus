import type { ApiExtensionType, HybridExtensionType } from '@directus/extensions';
import type { Router } from 'express';
import {
	log,
	registerActionGenerator,
	registerFilterGenerator,
	registerOperationGenerator,
	registerRouteGenerator,
	timeout,
} from './sandbox-extension-registration.js';

function* parameterIndexGenerator(): Generator<number, number, number> {
	let index = 0;

	while (true) {
		yield index++;
	}
}

function generateHostFunctionReference(
	index: Generator<number, number, number>,
	args: string[],
	{ async }: { async: boolean }
): string {
	const argsList = args.join(', ');
	const i = index.next().value;

	return `(${argsList}) => $${i}.apply(null, [${argsList}], { arguments: { reference: true }, result: { promise: ${
		async ? 'true' : 'false'
	} }});`;
}

export function generateApiExtensionsSandboxEntrypoint(
	type: ApiExtensionType | HybridExtensionType,
	name: string,
	endpointRouter: Router
) {
	const index = parameterIndexGenerator();

	const hostFunctions = [];

	const preamble = `
		const extensionExport = $${index.next().value}.deref();
	`;

	const context = `
		const log = ${generateHostFunctionReference(index, ['message'], { async: false })}
		const timeout = ${generateHostFunctionReference(index, ['milliseconds'], { async: true })}

		const context = { log, timeout };
	`;

	hostFunctions.push(log);
	hostFunctions.push(timeout);

	if (type === 'hook') {
		const code = `
			${preamble}
			${context}

			const filter = ${generateHostFunctionReference(index, ['event', 'handler'], { async: false })}
			const action = ${generateHostFunctionReference(index, ['event', 'handler'], { async: false })}

			extensionExport({ filter, action }, context);
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
			${preamble}
			${context}

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

			extensionExport(router, context);
		`;

		const { register, unregisterFunction } = registerRouteGenerator(name, endpointRouter);

		hostFunctions.push(register);

		return { code, hostFunctions, unregisterFunction };
	} else {
		const code = `
			${preamble}
			${context}

			const registerOperation = ${generateHostFunctionReference(index, ['id', 'handler'], { async: false })}

			const operationConfig = extensionExport(filter, context);

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
