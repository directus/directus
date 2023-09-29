import type { Context, Reference } from 'isolated-vm';
import type { ApiExtensionInfo } from '../vm.js';
import { createRequire } from 'node:module';
import env from '../../env.js';
import { fileURLToPath } from 'node:url';
import { readFileSync, readdirSync } from 'fs-extra';
import { join } from 'node:path';
import type { ExecFunction, ExecOptions } from '../add-exec-options.js';
import type { ExtensionManager } from '../extensions.js';

const require = createRequire(import.meta.url);
const ivm = require('isolated-vm');



export async function createExec(context: Context, extensionManager: ExtensionManager, extension: ApiExtensionInfo) {

	const __dirname = fileURLToPath(new URL('.', import.meta.url));

	const isolateCode = readFileSync(join(__dirname, 'vm.js'), 'utf-8');

	const execOptions = await loadExecOptions(extensionManager, extension);

	const scriptTimeoutMs = Number(env['EXTENSIONS_SECURE_TIMEOUT']);

	context.evalClosureSync(isolateCode, [
		ivm,
		new ivm.Reference(async function (type: unknown, options: unknown, callback: Reference<(error: Error, result: any) => void>) {
			try {
				if (typeof type !== 'string') {
					throw new TypeError('type must be a string');
				}

				if (!(type in execOptions)) {
					throw new Error(`Unknown exec option ${type}`);
				}

				const result = execOptions[type]!(options)

				callback.applyIgnored(undefined, [null, await result], { timeout: scriptTimeoutMs });
			} catch (error: any) {
				callback.applyIgnored(undefined, [error, null], { timeout: scriptTimeoutMs });
			}
		}),
		new ivm.Reference(async function (type: unknown, options: unknown) {
			try {
				if (typeof type !== 'string') {
					throw new TypeError('type must be a string');
				}

				if (!(type in execOptions)) {
					throw new Error(`Unknown exec option ${type}`);
				}

				const result = execOptions[type]!(options)

				return [null, await result];
			} catch (error: any) {
				return [error, null];
			}
		})
	]);
}

async function loadExecOptions(extensionManager: ExtensionManager, extension: ApiExtensionInfo) {
	const options: ExecOptions = {}
	const files = readdirSync(join(__dirname, '..', 'exec-options'));

	for (const file of files) {
		const addExecOptions = await import(join(__dirname, '..', 'exec-options', file));

		const execOptions = addExecOptions.default({ extensionManager, extension })

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
