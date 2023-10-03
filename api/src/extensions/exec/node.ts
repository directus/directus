import type { Context, Reference } from 'isolated-vm';
import type { ApiExtensionInfo } from '../vm.js';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import type { ExecFunction, ExecOptions } from '../utils/add-exec-options.js';
import type { ExtensionManager } from '../extensions.js';
import { readFile, readdir } from 'node:fs/promises';
import { resumeIsolate } from '../utils/resume-isolate.js';

const require = createRequire(import.meta.url);
const ivm = require('isolated-vm');
const __dirname = fileURLToPath(new URL('.', import.meta.url));

export async function createExec(context: Context, extensionManager: ExtensionManager, extension: ApiExtensionInfo) {

	const isolateCode = await readFile(join(__dirname, 'vm.js'), 'utf-8');

	const execOptions = await loadExecOptions(extensionManager, extension);

	await context.evalClosure(isolateCode, [
		ivm,
		new ivm.Reference(async function (args: unknown[], callback: Reference<(error: Error, result: any) => void>) {
			const type = args[0]

			console.log("execOptions", type, args)

			try {

				if (typeof type !== 'string') {
					throw new TypeError('type must be a string');
				}

				if (!(type in execOptions)) {
					throw new Error(`Unknown exec option ${type}`);
				}


				const result = await execOptions[type]!(args)

				resumeIsolate({ extensionManager, extension }, callback, [null, result])
			} catch (error: any) {
				console.error(error);

				resumeIsolate({ extensionManager, extension }, callback, [error, null])
			}
		}),
		// Future implementation for sync exec
		// new ivm.Reference(async function (type: unknown, options: unknown) {
		// 	try {
		// 		if (typeof type !== 'string') {
		// 			throw new TypeError('type must be a string');
		// 		}

		// 		if (!(type in execOptions)) {
		// 			throw new Error(`Unknown exec option ${type}`);
		// 		}

		// 		const result = execOptions[type]!(options)

		// 		return [null, await result];
		// 	} catch (error: any) {
		// 		return [error, null];
		// 	}
		// })
	]);
}

async function loadExecOptions(extensionManager: ExtensionManager, extension: ApiExtensionInfo) {
	const options: ExecOptions = {}
	const files = await readdir(join(__dirname, '..', 'exec-options'));

	for (const file of files) {
		const addExecOptions = await import(`../exec-options/${file.substring(0, file.length - 3)}.js`);

		const execOptions = addExecOptions.default({ extensionManager, extension }) as ExecOptions;

		for (const [key, value] of Object.entries(execOptions)) {
			if (key in options) {
				throw new Error(`Duplicate exec option ${key}`);
			}

			if (typeof value !== 'function') {
				throw new Error(`Invalid exec option ${key}`);
			}

			options[key] = value as ExecFunction;
		}
	}

	return options
}
