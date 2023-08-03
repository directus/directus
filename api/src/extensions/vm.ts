import type { ExtensionManager } from "./extensions.js";
import { createRequire } from 'node:module';
import { readFile } from 'fs/promises'
import { Isolate, Context } from 'isolated-vm';
import express, { Router } from 'express';
import { readFileSync } from "node:fs";
import * as url from 'url';
import { join } from 'path';
import type { ApiExtension, BundleExtension, DatabaseExtension, DatabaseExtensionPermission, HybridExtension } from "@directus/types";

const require = createRequire(import.meta.url);
const ivm = require('isolated-vm');
const WebSocket = require('ws');

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

type ExtensionInfo = (ApiExtension | BundleExtension | HybridExtension) & DatabaseExtension

export class VmManager {
	private extensionManager: ExtensionManager;
	private defineEndpoint: string;
	private defineHook: string;
	private defineOperation: string;
	public endpointRouter: Router;


	constructor(extensionManager: ExtensionManager, endpointRouter: Router) {
		this.extensionManager = extensionManager;
		this.endpointRouter = endpointRouter;

		this.defineEndpoint = readFileSync(join(__dirname, 'vm-functions', 'defineEndpoint.js'), 'utf-8');
		this.defineHook = readFileSync(join(__dirname, 'vm-functions', 'defineHook.js'), 'utf-8');
		this.defineOperation = readFileSync(join(__dirname, 'vm-functions', 'defineOperation.js'), 'utf-8');
		this.extensionManager
	}

	async runExtension(extension: ExtensionInfo, extensionPath: string) {
		const isolateSizeMb = 8;
		const scriptTimeoutMs = 1000;

		const isolate: Isolate = new ivm.Isolate({ inspector: true, memoryLimit: isolateSizeMb });
		this.createInspector(isolate.createInspectorSession())
		const context = await isolate.createContext({ inspector: true });

		this.prepareGeneralContext(context, extension.granted_permissions)


		if (extension.type === "endpoint") {
			this.prepareEndpointContext(context, extension.name)
		} else if (extension.type === "hook") {
			this.prepareHookContext(context, extension.name)
		} else if (extension.type === "operation") {
			this.prepareOperationContext(context, extension.name)
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

			if (hasHook) this.prepareHookContext(context, extension.name)
			if (hasOperation) this.prepareOperationContext(context, extension.name)
			if (hasEndpoint) this.prepareEndpointContext(context, extension.name)
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

	private async prepareGeneralContext(context: Context, permissions: DatabaseExtensionPermission[]) {
		const jail = context.global;
		jail.setSync('global', jail.derefInto());
		jail.setSync('console', new ivm.ExternalCopy({
			log: new ivm.Callback((...args: any[]) => {
				console.log(...args)
			})
		}).copyInto());

		jail.setSync('fetch', new ivm.ExternalCopy({
			get: new ivm.Callback(async (url: string) => {
				console.log(3)
				if (permissions.find(permission => permission.permission === 'web') === undefined) {
					return new Error("Permission denied")
				}
				return await (await fetch(url)).text()
			})
		}, { async: true }).copyInto())
	}

	private async prepareHookContext(context: Context, name: string) {
		const jail = context.global;

		context.eval(this.defineHook)
	}

	private async prepareOperationContext(context: Context, name: string) {
		const jail = context.global;

		context.eval(this.defineOperation)
	}

	private async prepareEndpointContext(context: Context, name: string) {
		const jail = context.global;

		const scopedRouter = express.Router();
		this.endpointRouter.use(`/${name}`, scopedRouter);

		context.eval(this.defineEndpoint)

		await jail.set('makeEndpoint', function (type: 'get' | 'post' | 'patch', path: string, callback: any) {
			scopedRouter[type](path, (req, res) => {
				callback(new ivm.ExternalCopy({
					url: req.url
				}).copyInto(), new ivm.ExternalCopy({
					send: new ivm.Callback((response: string) => {
						res.send(response)
					})
				}).copyInto())
			})

		});
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
