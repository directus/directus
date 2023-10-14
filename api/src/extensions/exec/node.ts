import type { ApiExtension, BundleExtension, HybridExtension } from '@directus/extensions';
import type IsolatedVM from 'isolated-vm';
import type { Context, Reference } from 'isolated-vm';
import { readFile, readdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ExecFunction, ExecOptions } from '../utils/add-exec-options.js';
import { resumeIsolate } from '../utils/resume-isolate.js';

const require = createRequire(import.meta.url);

const ivm = require('isolated-vm') as typeof IsolatedVM;

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export async function createExec(context: Context, extension: ApiExtension | HybridExtension | BundleExtension) {
	const isolateCode = await readFile(join(__dirname, 'vm.js'), 'utf-8');

	const execOptions = await loadExecOptions(extension);

	await context.evalClosure(isolateCode, [
		ivm,
		new ivm.Reference(async function (args: unknown[], callback: Reference<(error: Error, result: any) => void>) {
			const type = args[0];

			try {
				if (typeof type !== 'string') {
					throw new TypeError('type must be a string');
				}

				if (!(type in execOptions)) {
					throw new Error(`Unknown exec option ${type}`);
				}

				const result = await execOptions[type]!(args);

				resumeIsolate({ extensionManager, extension }, callback, [null, result]);
			} catch (error: any) {
				resumeIsolate({ extensionManager, extension }, callback, [error, null]);
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

async function loadExecOptions(extension: ApiExtension | HybridExtension | BundleExtension) {
	const options: ExecOptions = {};
	const files = await readdir(join(__dirname, '..', 'exec-options'));

	for (const file of files) {
		if (file.endsWith('.d.ts')) continue;

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

	return options;
}
