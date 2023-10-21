import type { ExtensionSandboxRequestedScopes } from '@directus/extensions';
import { numberGenerator } from '@directus/utils';
import type { Isolate, Module } from 'isolated-vm';
import { logGenerator, requestGenerator, sleepGenerator } from './api-sandbox-sdk.js';
import { generateHostFunctionReference } from './generate-host-function-reference.js';

function wrapUtil(util: any) {
	return async (...args: any[]) => {
		try {
			return { result: await util(...args), error: false };
		} catch (e) {
			return { result: e, error: true };
		}
	};
}

function getSdk() {
	return [
		{ name: 'log', generator: logGenerator, args: ['message'], async: false },
		{ name: 'sleep', generator: sleepGenerator, args: ['milliseconds'], async: true },
		{ name: 'request', generator: requestGenerator, args: ['url', 'options'], async: true },
	];
}

export async function instantiateSandboxSdk(
	isolate: Isolate,
	requestedScopes: ExtensionSandboxRequestedScopes
): Promise<Module> {
	const apiContext = await isolate.createContext();

	await apiContext.global.set('sdk', apiContext.global.derefInto());

	const index = numberGenerator();
	const sdk = getSdk();

	const handlerCode = sdk
		.map(({ name, args, async }) => `sdk.${name} = ${generateHostFunctionReference(index, args, { async })}`)
		.join('\n');

	await apiContext.evalClosure(
		handlerCode,
		sdk.map(({ generator, async }) => (async ? wrapUtil(generator(requestedScopes)) : generator(requestedScopes))),
		{ filename: '<extensions-sdk>', arguments: { reference: true } }
	);

	const exportCode = sdk.map(({ name }) => `export const ${name} = sdk.${name};`).join('\n');

	const apiModule = await isolate.compileModule(exportCode);

	await apiModule.instantiate(apiContext, () => {
		throw new Error();
	});

	return apiModule;
}
