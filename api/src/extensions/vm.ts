import type { ExtensionManager } from "./extensions.js";
import { createRequire } from 'node:module';
import { readFile } from 'fs/promises'
import { Isolate, Context } from 'isolated-vm';
import type { ApiExtension, BundleExtension, DatabaseExtension, HybridExtension } from "@directus/types";
import type { VMFunction } from "./vm-functions/vm-function.js";
import { FetchVMFunction } from "./vm-functions/fetch/node.js";
import { DefineEndpointVMFunction } from "./vm-functions/defineEndpoint/node.js";
import { DefineOperationVMFunction } from "./vm-functions/defineOperation/node.js";
import { DefineHookVMFunction } from "./vm-functions/defineHook/node.js";
import { ApiServiceVMFunction } from "./vm-functions/apiServices/node.js";
import { ConsoleVMFunction } from "./vm-functions/console/node.js";
import type { EventHandler } from "../types/events.js";
import emitter from "../emitter.js";

const require = createRequire(import.meta.url);
const ivm = require('isolated-vm')
const WebSocket = require('ws');

export type ApiExtensionInfo = (ApiExtension | BundleExtension | HybridExtension) & DatabaseExtension

export class VmManager {
	private extensionManager: ExtensionManager;
	private vmFunctions: VMFunction[] = [];

	private defineEndpoint: DefineEndpointVMFunction;
	private defineHook: DefineHookVMFunction;
	private defineOperation: DefineOperationVMFunction;

	constructor(extensionManager: ExtensionManager) {
		this.extensionManager = extensionManager;

		this.vmFunctions.push(new FetchVMFunction())
		this.vmFunctions.push(new ApiServiceVMFunction())
		this.vmFunctions.push(new ConsoleVMFunction())
		this.defineEndpoint = new DefineEndpointVMFunction(this.extensionManager)
		this.defineHook = new DefineHookVMFunction()
		this.defineOperation = new DefineOperationVMFunction()
	}

	async runExtension(extension: ApiExtensionInfo, extensionPath: string) {
		const isolateSizeMb = 8;
		const scriptTimeoutMs = 1000;

		let code = await readFile(extensionPath, 'utf-8')

		const isolate: Isolate = new ivm.Isolate({ inspector: true, memoryLimit: isolateSizeMb });
		this.createInspector(isolate.createInspectorSession())
		const context = await isolate.createContext({ inspector: true });

		await this.prepareGeneralContext(context, extension)

		let runExtensionCode;
		let hookEvents: EventHandler[] = []

		if (extension.type === "endpoint") {
			await this.defineEndpoint.prepareContext(context, extension)
			runExtensionCode = `import ext from 'extension.js'; defineEndpoint(ext)`
		} else if (extension.type === "hook") {
			hookEvents = await this.defineHook.prepareContext(context, extension)
			runExtensionCode = `import ext from 'extension.js'; defineHook(ext)`
		} else if (extension.type === "operation") {
			await this.defineOperation.prepareContext(context, extension)
			runExtensionCode = `import ext from 'extension.js'; defineOperationApi(ext)`
		} else if (extension.type === "bundle") {
			let hasHook = false;
			let hasOperation = false;
			let hasEndpoint = false;

			extension.entries.forEach(entry => {
				if (entry.type === "hook") {
					hasHook = true;
				} else if (entry.type === "operation") {
					hasOperation = true;
				} else if (entry.type === "endpoint") {
					hasEndpoint = true;
				}
			})
			runExtensionCode = `import {endpoints, hooks, operations} from 'extension.js';`

			if (hasHook) {
				hookEvents = await this.defineHook.prepareContext(context, extension)
				runExtensionCode += `for(let hook of hooks) { defineHook(hook.config) }`
			}
			if (hasOperation) {
				await this.defineOperation.prepareContext(context, extension)
				runExtensionCode += `for(let operation of operations) { defineOperationApi(operation.config) }`

			}
			if (hasEndpoint) {
				await this.defineEndpoint.prepareContext(context, extension)
				runExtensionCode += `for(let endpoint of endpoints) { defineEndpoint(endpoint.config) }`
			}

		} else {
			throw new Error("Unknown extension type")
		}

		const runModule = await isolate.compileModule(runExtensionCode)

		await runModule.instantiate(context, (specifier: string) => {
			if (specifier === 'extension.js') {
				return isolate.compileModule(code)
			}
			throw new Error(`Cannot find module ${specifier}`)
		})

		runModule.evaluate({
			timeout: scriptTimeoutMs
		}).then(() => {
			console.log('Script completed successfully');
		}).catch((err: any) => {
			console.log('Script failed:', err);
		})

		const unregister = async () => {
			try {
				isolate.dispose();
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

			} catch (err) { }
		}

		return unregister
	}

	private async prepareGeneralContext(context: Context, extension: ApiExtensionInfo) {
		const jail = context.global;
		jail.setSync('global', jail.derefInto());

		for (let vmFunction of this.vmFunctions) {
			await vmFunction.prepareContext(context, extension)
		}
	}

	private async createInspector(channel: any) {
		return

		let wss = new WebSocket.Server({ port: 10000 });

		wss.on('connection', function (ws: any) {
			function dispose() {
				try {
					channel.dispose();
				} catch (err) { }
			}
			ws.on('error', dispose);
			ws.on('close', dispose);

			// Relay messages from frontend to backend
			ws.on('message', function (message: any) {
				try {
					channel.dispatchProtocolMessage(String(message));
				} catch (err) {
					// This happens if inspector session was closed unexpectedly
					ws.close();
				}
			});

			// Relay messages from backend to frontend
			function send(message: any) {
				try {
					ws.send(message);
				} catch (err) {
					dispose();
				}
			}
			channel.onResponse = (callId: any, message: any) => send(message);
			channel.onNotification = send;
		});
		console.log('Inspector: devtools://devtools/bundled/inspector.html?experiments=true&v8only=true&ws=127.0.0.1:10000');
	}
}
