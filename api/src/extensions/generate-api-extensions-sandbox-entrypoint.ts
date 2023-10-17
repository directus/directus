import type { ApiExtensionType, HybridExtensionType } from '@directus/extensions';
import {
	log,
	registerActionGenerator,
	registerFilterGenerator,
	registerOperationGenerator,
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

export function generateApiExtensionsSandboxEntrypoint(type: ApiExtensionType | HybridExtensionType) {
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

		const { filter, filterUnregisterFunctions } = registerFilterGenerator();
		const { action, actionUnregisterFunctions } = registerActionGenerator();

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

			const router = {
				get: (route, cb) => {
					exec('register-endpoint', 'get', route, cb);
				},
				post: (route, cb) => {
					exec('register-endpoint', 'post', route, cb);
				}
			};

			extensionExport(router, context);
		`;

		const unregisterFunction = async () => {};

		return { code, hostFunctions, unregisterFunction };
	} else {
		const code = `
			${preamble}
			${context}

			const registerOperation = ${generateHostFunctionReference(index, ['id', 'handler'], { async: false })}

			const operationConfig = extensionExport(filter, context);

			registerOperation(operationConfig.id, operationConfig.handler);
		`;

		const { registerOperation, registerOperationUnregisterFunctions } = registerOperationGenerator();

		hostFunctions.push(registerOperation);

		const unregisterFunction = async () => {
			await Promise.all(registerOperationUnregisterFunctions.map((fn) => fn()));
		};

		return { code, hostFunctions, unregisterFunction };
	}
}
