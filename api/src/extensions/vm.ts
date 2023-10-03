import type { ExtensionManager } from './extensions.js';
import { createRequire } from 'node:module';
import { readFile } from 'fs/promises';
import { Isolate } from 'isolated-vm';
import type { ApiExtension, BundleExtension, DatabaseExtension, HybridExtension } from '@directus/types';
import logger from '../logger.js';
import env from '../env.js';
import { createExec } from './exec/node.js';

const require = createRequire(import.meta.url);
const ivm = require('isolated-vm');
const WebSocket = require('ws');

export type ApiExtensionInfo = (ApiExtension | BundleExtension | HybridExtension) & DatabaseExtension;

export class VmManager {
	private extensionManager: ExtensionManager;
	private debuggerPort = 10000;

	constructor(extensionManager: ExtensionManager) {
		this.extensionManager = extensionManager;
	}

	async runExtension(extension: ApiExtensionInfo) {
		if (extension.type === 'endpoint') {
			await this.run(`import ext from 'extension.js'; ext()`, extension);
		} else if (extension.type === 'hook') {
			await this.run(`import ext from 'extension.js'; ext()`, extension);
		} else if (extension.type === 'operation') {
			await this.run(
				`import ext from 'extension.js'; ext()`,
				extension,
			);
		} else if (extension.type === 'bundle') {
			for (const innerExtension of extension.entries) {
				if (innerExtension.type === 'endpoint') {
					await this.run(
						`import { endpoints } from 'extension.js'; const endpoint = endpoints.find(endpoint => endpoint.name === ${innerExtension.name}) endpoint()`,
						extension,
					);
				} else if (innerExtension.type === 'hook') {
					await this.run(
						`import { hooks } from 'extension.js'; const hook = hooks.find(hook => hook.name === ${innerExtension.name}) hook()`,
						extension,
					);
				} else if (innerExtension.type === 'operation') {
					await this.run(
						`import { operations } from 'extension.js'; const operation = operations.find(operation => operation.name === ${innerExtension.name}) operation()`,
						extension,
					);
				}
			}
		}
	}

	private async run(startCode: string, extension: ApiExtensionInfo) {
		const isolateSizeMb = Number(env['EXTENSIONS_SECURE_MEMORY']);
		const scriptTimeoutMs = Number(env['EXTENSIONS_SECURE_TIMEOUT']);

		const extensionCode = await readFile(extension.apiExtensionPath!, 'utf-8');

		const enableDebugger = false;

		const isolate: Isolate = new ivm.Isolate({ inspector: enableDebugger, memoryLimit: isolateSizeMb });
		if (enableDebugger) this.createInspector(isolate.createInspectorSession(), extension.name);
		const context = await isolate.createContext({ inspector: enableDebugger });

		const jail = context.global;
		jail.setSync('global', jail.derefInto());

		jail.setSync('log', console.log)

		await createExec(context, this.extensionManager, extension);

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

		this.extensionManager.registration.addUnregisterFunction(extension.name, async () => {
			try {
				if (isolate.isDisposed) return;
				isolate.dispose();
			} catch (err) {
				logger.error(err);
			}
		})
	}

	private async createInspector(channel: any, extensionName: string) {
		const wss = new WebSocket.Server({ port: this.debuggerPort });

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

			channel.onResponse = (callId: any, message: any) => send(message);
			channel.onNotification = send;
		});

		console.log(
			`${extensionName} Inspector: devtools://devtools/bundled/inspector.html?experiments=true&v8only=true&ws=127.0.0.1:${this.debuggerPort}`
		);

		this.debuggerPort++;
	}
}
