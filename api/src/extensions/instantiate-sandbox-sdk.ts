import { numberGenerator } from '@directus/utils';
import type { Isolate, Module } from 'isolated-vm';
import { log, sleep } from './api-sandbox-sdk.js';
import { generateHostFunctionReference } from './generate-host-function-reference.js';

function getSdk() {
	return [
		{ name: 'log', handler: log, args: ['message'], async: false },
		{ name: 'sleep', handler: sleep, args: ['milliseconds'], async: true },
	];
}

export async function instantiateSandboxSdk(isolate: Isolate): Promise<Module> {
	const apiContext = await isolate.createContext();

	const index = numberGenerator();
	const sdk = getSdk();

	const handlerCode = sdk
		.map(({ name, args, async }) => `globalThis.${name} = ${generateHostFunctionReference(index, args, { async })}`)
		.join('\n');

	await apiContext.evalClosure(
		handlerCode,
		sdk.map(({ handler }) => handler),
		{ arguments: { reference: true } }
	);

	const exportCode = sdk.map(({ name }) => `export const ${name} = globalThis.${name};`).join('\n');

	const apiModule = await isolate.compileModule(exportCode);

	await apiModule.instantiate(apiContext, () => {
		throw new Error();
	});

	return apiModule;
}
