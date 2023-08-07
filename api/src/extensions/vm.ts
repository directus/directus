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
		this.defineEndpoint = new DefineEndpointVMFunction(this.extensionManager)
		this.defineHook = new DefineHookVMFunction()
		this.defineOperation = new DefineOperationVMFunction()
	}

	async runExtension(extension: ApiExtensionInfo, extensionPath: string) {
		const isolateSizeMb = 8;
		const scriptTimeoutMs = 1000;

		const isolate: Isolate = new ivm.Isolate({ inspector: true, memoryLimit: isolateSizeMb });
		this.createInspector(isolate.createInspectorSession())
		const context = await isolate.createContext({ inspector: true });

		this.prepareGeneralContext(context, extension)


		if (extension.type === "endpoint") {
			this.defineEndpoint.prepareContext(context, extension)
		} else if (extension.type === "hook") {
			this.defineHook.prepareContext(context, extension)
		} else if (extension.type === "operation") {
			this.defineOperation.prepareContext(context, extension)
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

			if (hasHook) this.defineHook.prepareContext(context, extension)
			if (hasOperation) this.defineOperation.prepareContext(context, extension)
			if (hasEndpoint) this.defineEndpoint.prepareContext(context, extension)
		}

		let code = await readFile(extensionPath, 'utf-8')

		context.eval(code, {
			timeout: scriptTimeoutMs
		}).then(() => {
			console.log('Script completed successfully');
		}).catch((err: any) => {
			console.log('Script failed:', err);
		})
	}

	private async prepareGeneralContext(context: Context, extension: ApiExtensionInfo) {
		const jail = context.global;
		jail.setSync('global', jail.derefInto());
		jail.setSync('console', new ivm.ExternalCopy({
			log: new ivm.Callback((...args: any[]) => {
				console.log("V8: ", ...args)
			})
		}).copyInto());

		for (let vmFunction of this.vmFunctions) {
			vmFunction.prepareContext(context, extension)
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
