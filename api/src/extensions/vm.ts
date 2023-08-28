import type { ExtensionManager } from './extensions.js';
import { createRequire } from 'node:module';
import { readFile } from 'fs/promises';
import { Isolate, Context } from 'isolated-vm';
import type { ApiExtension, BundleExtension, DatabaseExtension, HybridExtension } from '@directus/types';
import type { VMFunction } from './vm-functions/vm-function.js';
import { FetchVMFunction } from './vm-functions/fetch/node.js';
import { DefineEndpointVMFunction } from './vm-functions/defineEndpoint/node.js';
import { DefineOperationVMFunction } from './vm-functions/defineOperation/node.js';
import { DefineHookVMFunction } from './vm-functions/defineHook/node.js';
import { ApiServiceVMFunction } from './vm-functions/apiServices/node.js';
import { ConsoleVMFunction } from './vm-functions/console/node.js';
import { LoggerVMFunction } from './vm-functions/logger/node.js';
import type { EventHandler } from '../types/events.js';
import emitter from '../emitter.js';
import logger from '../logger.js';
import env from '../env.js';

const require = createRequire(import.meta.url);
const ivm = require('isolated-vm');
const WebSocket = require('ws');

export type ApiExtensionInfo = (ApiExtension | BundleExtension | HybridExtension) & DatabaseExtension;

export class VmManager {
	private extensionManager: ExtensionManager;
	private vmFunctions: VMFunction[] = [];

	private defineEndpoint: DefineEndpointVMFunction;
	private defineHook: DefineHookVMFunction;
	private defineOperation: DefineOperationVMFunction;
	private debuggerPort = 10000;

	constructor(extensionManager: ExtensionManager) {
		this.extensionManager = extensionManager;

		this.vmFunctions.push(new FetchVMFunction());
		this.vmFunctions.push(new ApiServiceVMFunction());
		this.vmFunctions.push(new ConsoleVMFunction());
		this.vmFunctions.push(new LoggerVMFunction());
		this.defineEndpoint = new DefineEndpointVMFunction(this.extensionManager);
		this.defineHook = new DefineHookVMFunction(this.extensionManager);
		this.defineOperation = new DefineOperationVMFunction();
	}

	async runExtension(extension: ApiExtensionInfo) {
		if (extension.type === 'endpoint') {
			return this.run(`import ext from 'extension.js'; defineEndpoint(ext)`, extension);
		} else if (extension.type === 'hook') {
			return this.run(`import ext from 'extension.js'; defineHook(ext)`, extension);
		} else if (extension.type === 'operation') {
			return this.run(
				`import ext from 'extension.js'; defineOperationApi(ext)`,
				extension,
			);
		} else if (extension.type === 'bundle') {
			const unregisterFunctions: (() => Promise<void>)[] = [];

			for (const innerExtension of extension.entries) {
				if (innerExtension.type === 'endpoint') {
					const unregister = await this.run(
						`import { endpoints } from 'extension.js'; const endpoint = endpoints.find(endpoint => endpoint.name === ${innerExtension.name}) defineEndpoint(endpoint)`,
						extension,
					);

					unregisterFunctions.push(unregister);
				} else if (innerExtension.type === 'hook') {
					const unregister = await this.run(
						`import { hooks } from 'extension.js'; const hook = hooks.find(hook => hook.name === ${innerExtension.name}) defineHook(hook)`,
						extension,
					);

					unregisterFunctions.push(unregister);
				} else if (innerExtension.type === 'operation') {
					const unregister = await this.run(
						`import { operations } from 'extension.js'; const operation = operations.find(operation => operation.name === ${innerExtension.name}) defineOperationApi(operation)`,
						extension,
					);

					unregisterFunctions.push(unregister);
				}
			}

			return async () => {
				for (const unregister of unregisterFunctions) {
					await unregister();
				}
			};
		}

		return () => {
			/* do nothing */
		}
	}

	private async run(startCode: string, extension: ApiExtensionInfo) {
		const isolateSizeMb = Number(env['EXTENSIONS_SECURE_MEMORY']);
		const scriptTimeoutMs = Number(env['EXTENSIONS_SECURE_TIMEOUT']);

		const extensionCode = await readFile(extension.apiExtensionPath!, 'utf-8');

		const enableDebugger = extension.debugger === true;

		const isolate: Isolate = new ivm.Isolate({ inspector: enableDebugger, memoryLimit: isolateSizeMb });
		if (enableDebugger) this.createInspector(isolate.createInspectorSession(), extension.name);
		const context = await isolate.createContext({ inspector: enableDebugger });

		await this.prepareGeneralContext(context, extension);

		let hookEvents: EventHandler[] = [];

		if (extension.type === 'endpoint') {
			await this.defineEndpoint.prepareContext(context, extension);
		} else if (extension.type === 'hook') {
			hookEvents = await this.defineHook.prepareContext(context, extension);
		} else if (extension.type === 'operation') {
			await this.defineOperation.prepareContext(context, extension);
		}

		const runModule = await isolate.compileModule(startCode, { filename: 'extensionLoader.js' });

		await runModule.instantiate(context, (specifier: string) => {
			if (specifier === 'extension.js') {
				return isolate.compileModule(extensionCode, {
					filename: extension.apiExtensionPath!,
				});
			}

			throw new Error(`Cannot find module ${specifier} for extension ${extension.name}`);
		});

		runModule.evaluate({
			timeout: scriptTimeoutMs,
		});

		const unregister = async () => {
			try {
				// TODO: Figure out why I can't release the context
				// if (isolate.isDisposed === false) isolate.dispose();

				// context.release()

				for (const event of hookEvents) {
					switch (event.type) {
						case 'filter':
							emitter.offFilter(event.name, event.handler);
							break;
						case 'action':
							emitter.offAction(event.name, event.handler);
							break;
						case 'init':
							emitter.offInit(event.name, event.handler);
							break;
						case 'schedule':
							await event.job.stop();
							break;
					}
				}
			} catch (err) {
				logger.error(err);
			}
		};

		return unregister;
	}

	private async prepareGeneralContext(context: Context, extension: ApiExtensionInfo) {
		const jail = context.global;
		jail.setSync('global', jail.derefInto());

		context.eval(`globalThis.API = {}`);

		for (const vmFunction of this.vmFunctions) {
			await vmFunction.prepareContext(context, extension);
		}
	}

	private async createInspector(channel: any, extensionName: string) {
		const wss = new WebSocket.Server({ port: this.debuggerPort });

		wss.on('connection', function (ws: any) {
			function dispose() {
				try {
					channel.dispose();
				} catch (err) {
					// @ts-ignore
					console.error(err);
				}
			}

			ws.on('error', dispose);
			ws.on('close', dispose);

			// Relay messages from frontend to backend
			ws.on('message', function (message: any) {
				try {
					channel.dispatchProtocolMessage(message.toString());
				} catch (err) {
					// This happens if inspector session was closed unexpectedly
					ws.close();
				}
			});

			// Relay messages from backend to frontend
			function send(message: any) {
				try {
					ws.send(message.toString());
				} catch (err) {
					dispose();
				}
			}

			channel.onResponse = (_callId: any, message: any) => send(message);
			channel.onNotification = send;
		});

		logger.info(
			`${extensionName} Inspector: devtools://devtools/bundled/inspector.html?experiments=true&v8only=true&ws=127.0.0.1:${this.debuggerPort}`
		);

		this.debuggerPort++;
	}
}
