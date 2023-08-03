import type { ExtensionManager } from "./extensions.js";
import { createRequire } from 'node:module';
import { readFile } from 'fs/promises'
import { ExternalCopy, Isolate } from 'isolated-vm';
import express, { Router } from 'express';
import { readFileSync } from "node:fs";
import * as url from 'url';

const require = createRequire(import.meta.url);
const ivm = require('isolated-vm');
const WebSocket = require('ws');

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));


export class VmManager {
	private extensionManager: ExtensionManager;
	private defineEndpoint: string;
	private defineHook: string;
	private defineOperation: string;
	public endpointRouter: Router;


	constructor(extensionManager: ExtensionManager, endpointRouter: Router) {
		this.extensionManager = extensionManager;
		this.endpointRouter = endpointRouter;

		this.defineEndpoint = readFileSync(`${__dirname}vm-functions/defineEndpoint.js`, 'utf-8')
		this.defineHook = readFileSync(`${__dirname}vm-functions/defineHook.js`, 'utf-8')
		this.defineOperation = readFileSync(`${__dirname}vm-functions/defineOperation.js`, 'utf-8')
	}

	async run() {
		this.extensionManager

		const isolateSizeMb = 64;
		const scriptTimeoutMs = 1_000;

		const isolate: Isolate = new ivm.Isolate({ inspector: true, memoryLimit: isolateSizeMb });
		const context = await isolate.createContext({ inspector: true });

		const jail = context.global;
		jail.setSync('global', jail.derefInto());

		jail.setSync('log', function (...args: any[]) {
			console.log(...args);
		});

		jail.setSync('addOne', function (num: number) {
			return num + 1;
		});

		jail.setSync('process', { env: {} }, { copy: true });

		try {
			context.eval(`
            while (true) {}
        `, {
				timeout: scriptTimeoutMs
			}).then(() => {
				console.log('Script completed successfully');
			}).catch((err: any) => {
				console.log('Script failed:', err);
			})
		} catch (e) {
			console.log('Script failed:', e);
		}
	}

	async runHook(hookPath: string, name: string) {
		console.log("Running hook", hookPath, name)
	}

	async runEndpoint(bundlePath: string, name: string) {

	}

	async runOperation() {

	}

	async runBundle() {

	}

	private async runExtension() {
		console.log("endpoint", name)
		const isolateSizeMb = 8;
		const scriptTimeoutMs = 1000;

		const scopedRouter = express.Router();
		this.endpointRouter.use(`/${name}`, scopedRouter);

		const isolate: Isolate = new ivm.Isolate({ inspector: true, memoryLimit: isolateSizeMb });
		this.createInspector(isolate.createInspectorSession())
		const context = await isolate.createContext({ inspector: true });

		const jail = context.global;
		jail.setSync('global', jail.derefInto());

		const consoleObj: ExternalCopy = new ivm.ExternalCopy({
			log: new ivm.Callback((...args: any[]) => {
				console.log(...args)
			})
		});

		jail.setSync('console', consoleObj.copyInto());
		jail.setSync('ivm', ivm)

		context.eval(this.defineEndpoint)

		jail.setSync('makeEndpoint', function (type: 'get' | 'post' | 'patch', path: string, callback: any) {
			console.log("makeEndpoint", type, `/${name}${path}`, callback)

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

		let code = await readFile(bundlePath, 'utf-8')

		context.eval(code, {
			timeout: scriptTimeoutMs
		}).then(() => {
			console.log('Script completed successfully');
		}).catch((err: any) => {
			console.log('Script failed:', err);
		})
	}

	private async createInspector(channel: any) {
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
