import type {
	ActionHandler,
	ApiExtension,
	BundleExtension,
	DatabaseExtension,
	EmbedHandler,
	EndpointConfig,
	FilterHandler,
	HookConfig,
	HybridExtension,
	InitHandler,
	OperationApiConfig,
	ScheduleHandler,
} from '@directus/types';
import getModuleDefault from '../utils/get-module-default.js';
import type { ExtensionManager } from './extensions.js';
import path from 'path';
import logger from '../logger.js';
import { generateExtensionsEntrypoint, pathToRelativeUrl, resolvePackage } from '@directus/utils/node';
import emitter from '../emitter.js';
import { getFlowManager } from '../flows.js';
import { getSchema } from '../utils/get-schema.js';
import getDatabase from '../database/index.js';
import env from '../env.js';
import * as services from '../services/index.js';
import express, { Router } from 'express';
import { APP_SHARED_DEPS } from '@directus/constants';
import { rollup } from 'rollup';

import { escapeRegExp } from 'lodash-es';
import { Url } from '../utils/url.js';

import aliasDefault from '@rollup/plugin-alias';
import nodeResolveDefault from '@rollup/plugin-node-resolve';
import virtualDefault from '@rollup/plugin-virtual';

import { readdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { scheduleSynchronizedJob, validateCron } from '../utils/schedule.js';
import type { ApiExtensionInfo } from './vm.js';

const virtual = virtualDefault as unknown as typeof virtualDefault.default;
const alias = aliasDefault as unknown as typeof aliasDefault.default;
const nodeResolve = nodeResolveDefault as unknown as typeof nodeResolveDefault.default;

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));

type BundleConfig = {
	endpoints: { name: string; config: EndpointConfig }[];
	hooks: { name: string; config: HookConfig }[];
	operations: { name: string; config: OperationApiConfig }[];
};

type RunningApiExtension = {
	extension: string;
	unregister: () => void | Promise<void>;
};

export class RegistrationManager {
	private extensionManager: ExtensionManager;
	// runningApiExtensions can have multiple entries for the same extension
	private runningApiExtensions: RunningApiExtension[] = [];
	public endpointRouter: Router;
	private appExtensionChunks: Map<string, string>;

	constructor(extensionManager: ExtensionManager) {
		this.extensionManager = extensionManager;
		this.endpointRouter = Router();
		this.appExtensionChunks = new Map();
	}

	public async registerHooks(): Promise<void> {
		const hooks = this.extensionManager
			.getEnabledExtensions()
			.filter((extension) => extension.type === 'hook') as (ApiExtension & DatabaseExtension)[];

		for (const hook of hooks) {
			try {

				if (hook.secure) {
					await this.extensionManager.vm.runExtension(hook);
					continue
				}

				const hookPath = hook.apiExtensionPath!

				const hookInstance: HookConfig | { default: HookConfig } = await import(
					`./${pathToRelativeUrl(hookPath, __dirname)}?t=${Date.now()}`
				);

				const config = getModuleDefault(hookInstance);

				this.registerHook(config, hook.name, hook.name);

				this.addUnregisterFunction(hook.name, () => {
					delete require.cache[require.resolve(hookPath)];
				});
			} catch (error: any) {
				logger.warn(`Couldn't register hook "${hook.name}"`);
				logger.warn(error);
			}
		}
	}

	public async registerEndpoints(): Promise<void> {
		const endpoints = this.extensionManager
			.getEnabledExtensions()
			.filter((extension) => extension.type === 'endpoint') as (ApiExtension & DatabaseExtension)[];

		for (const endpoint of endpoints) {
			try {
				if (endpoint.secure) {
					await this.extensionManager.vm.runExtension(endpoint);
					continue
				}

				const endpointPath = endpoint.apiExtensionPath!;

				const endpointInstance: EndpointConfig | { default: EndpointConfig } = await import(
					`./${pathToRelativeUrl(endpointPath, __dirname)}?t=${Date.now()}`
				);

				const config = getModuleDefault(endpointInstance);

				this.registerEndpoint(config, endpoint.name, endpoint.name);

				this.addUnregisterFunction(endpoint.name, () => {
					delete require.cache[require.resolve(endpointPath)];
				});
			} catch (error: any) {
				logger.warn(`Couldn't register endpoint "${endpoint.name}"`);
				logger.warn(error);
			}
		}
	}

	public async registerOperations(): Promise<void> {
		const internalOperations = await readdir(path.join(__dirname, '../', 'operations'));

		for (const operation of internalOperations) {
			const operationInstance: OperationApiConfig | { default: OperationApiConfig } = await import(
				`../operations/${operation}/index.js`
			);

			const config = getModuleDefault(operationInstance);

			this.registerOperation(config, operation);
		}

		const operations = this.extensionManager
			.getEnabledExtensions()
			.filter((extension) => extension.type === 'operation') as (HybridExtension & DatabaseExtension)[];

		for (const operation of operations) {
			try {

				if (operation.secure) {
					await this.extensionManager.vm.runExtension(operation);
					continue
				}

				const operationPath = operation.apiExtensionPath!

				const operationInstance: OperationApiConfig | { default: OperationApiConfig } = await import(
					`./${pathToRelativeUrl(operationPath, __dirname)}?t=${Date.now()}`
				);

				const config = getModuleDefault(operationInstance);

				this.registerOperation(config, operation.name);

				this.addUnregisterFunction(operation.name, () => {
					delete require.cache[require.resolve(operationPath)];
				});
			} catch (error: any) {
				logger.warn(`Couldn't register operation "${operation.name}"`);
				logger.warn(error);
			}
		}
	}

	public async registerBundles(): Promise<void> {
		const bundles = this.extensionManager
			.getEnabledExtensions()
			.filter((extension) => extension.type === 'bundle') as (BundleExtension & DatabaseExtension)[];

		for (const bundle of bundles) {
			try {

				if (bundle.secure) {
					await this.extensionManager.vm.runExtension(bundle);
					continue
				}

				const bundlePath = bundle.apiExtensionPath!;

				const bundleInstances: BundleConfig | { default: BundleConfig } = await import(
					`./${pathToRelativeUrl(bundlePath, __dirname)}?t=${Date.now()}`
				);

				const configs = getModuleDefault(bundleInstances);

				for (const { config, name } of configs.hooks) {
					this.registerHook(config, name, bundle.name)
				}

				for (const { config, name } of configs.endpoints) {
					this.registerEndpoint(config, name, bundle.name);
				}

				for (const { config } of configs.operations) {
					this.registerOperation(config, bundle.name);
				}

				this.addUnregisterFunction(bundle.name, async () => {
					delete require.cache[require.resolve(bundlePath)];
				});
			} catch (error: any) {
				logger.warn(`Couldn't register bundle "${bundle.name}"`);
				logger.warn(error);
			}
		}
	}

	public registerHook(register: HookConfig, name: string, extensionName: string) {
		let scheduleIndex = 0;

		const registerFunctions = {
			filter: (event: string, handler: FilterHandler) => {
				emitter.onFilter(event, handler);

				this.addUnregisterFunction(extensionName, async () => {
					emitter.offFilter(event, handler);
				})
			},
			action: (event: string, handler: ActionHandler) => {
				emitter.onAction(event, handler);

				this.addUnregisterFunction(extensionName, async () => {
					emitter.offAction(event, handler);
				})
			},
			init: (event: string, handler: InitHandler) => {
				emitter.onInit(event, handler);

				this.addUnregisterFunction(extensionName, async () => {
					emitter.offInit(event, handler);
				})
			},
			schedule: (cron: string, handler: ScheduleHandler) => {
				if (validateCron(cron)) {
					const job = scheduleSynchronizedJob(`${name}:${scheduleIndex}`, cron, async () => {
						if (this.extensionManager.options.schedule) {
							try {
								await handler();
							} catch (error: any) {
								logger.error(error);
							}
						}
					});

					scheduleIndex++;

					this.addUnregisterFunction(extensionName, async () => {
						await job.stop();
					})
				} else {
					logger.warn(`Couldn't register cron hook. Provided cron is invalid: ${cron}`);
				}
			},
			embed: (position: 'head' | 'body', code: string | EmbedHandler) => {
				const content = typeof code === 'function' ? code() : code;

				if (content.trim().length === 0) {
					logger.warn(`Couldn't register embed hook. Provided code is empty!`);
					return;
				}

				if (position === 'head') {
					this.extensionManager.hookEmbedsHead.push(content);

					this.addUnregisterFunction(extensionName, async () => {
						this.extensionManager.hookEmbedsHead = this.extensionManager.hookEmbedsHead.filter((embed) => embed !== content);
					})
				}

				if (position === 'body') {
					this.extensionManager.hookEmbedsBody.push(content);

					this.addUnregisterFunction(extensionName, async () => {
						this.extensionManager.hookEmbedsBody = this.extensionManager.hookEmbedsBody.filter((embed) => embed !== content);
					})
				}
			},
		};

		register(registerFunctions, {
			services,
			env,
			database: getDatabase(),
			emitter: this.extensionManager.apiEmitter,
			logger,
			getSchema,
		});
	}

	private registerEndpoint(config: EndpointConfig, name: string, extensionName: string): void {
		const register = typeof config === 'function' ? config : config.handler;
		const routeName = typeof config === 'function' ? name : config.id;

		const scopedRouter = express.Router();
		this.endpointRouter.use(`/${routeName}`, scopedRouter);

		register(scopedRouter, {
			services,
			env,
			database: getDatabase(),
			emitter: this.extensionManager.apiEmitter,
			logger,
			getSchema,
		});

		this.addUnregisterFunction(extensionName, () => {
			this.endpointRouter.stack = this.endpointRouter.stack.filter((layer) => {
				return scopedRouter !== layer.handle
			})
		})

	}

	private registerOperation(config: OperationApiConfig, extensionName: string): void {
		const flowManager = getFlowManager();

		flowManager.addOperation(config.id, config.handler);

		this.addUnregisterFunction(extensionName, () => {
			flowManager.removeOperation(config.id);
		})
	}

	public async restartSecureExtension(name: string) {
		await this.unregisterApiExtension(name);

		const extension = this.extensionManager.getEnabledExtensions().find((extension) => extension.name === name);

		if (!extension) return

		await this.extensionManager.vm.runExtension(extension as ApiExtensionInfo);
	}

	public addUnregisterFunction(extension: string, unregister: () => void | Promise<void>): void {
		this.runningApiExtensions.push({
			extension,
			unregister,
		});
	}

	public async unregisterApiExtension(name: string): Promise<void> {
		for (const extension of this.runningApiExtensions) {
			if (extension.extension === name) {
				await extension.unregister();
			}
		}
	}

	public async unregisterApiExtensions(): Promise<void> {
		for (const extension of this.runningApiExtensions) {
			await extension.unregister();
		}

		this.endpointRouter.stack = [];

		const flowManager = getFlowManager();

		flowManager.clearOperations();
	}

	public getAppExtensionChunk(name: string): string | null {
		return this.appExtensionChunks.get(name) ?? null;
	}

	public async generateExtensionBundle(): Promise<string | null> {
		const sharedDepsMapping = await this.getSharedDepsMapping(APP_SHARED_DEPS);

		const internalImports = Object.entries(sharedDepsMapping).map(([name, path]) => ({
			find: name,
			replacement: path,
		}));

		const entrypoint = generateExtensionsEntrypoint(this.extensionManager.getEnabledExtensions());

		try {
			const bundle = await rollup({
				input: 'entry',
				external: Object.values(sharedDepsMapping),
				makeAbsoluteExternalsRelative: false,
				plugins: [virtual({ entry: entrypoint }), alias({ entries: internalImports }), nodeResolve({ browser: true })],
			});

			const { output } = await bundle.generate({ format: 'es', compact: true });

			for (const out of output) {
				if (out.type === 'chunk') {
					this.appExtensionChunks.set(out.fileName, out.code);
				}
			}

			await bundle.close();

			return output[0].code;
		} catch (error: any) {
			logger.warn(`Couldn't bundle App extensions`);
			logger.warn(error);
		}

		return null;
	}

	private async getSharedDepsMapping(deps: string[]): Promise<Record<string, string>> {
		const appDir = await readdir(path.join(resolvePackage('@directus/app', __dirname), 'dist', 'assets'));

		const depsMapping: Record<string, string> = {};

		for (const dep of deps) {
			const depRegex = new RegExp(`${escapeRegExp(dep.replace(/\//g, '_'))}\\.[0-9a-f]{8}\\.entry\\.js`);
			const depName = appDir.find((file) => depRegex.test(file));

			if (depName) {
				const depUrl = new Url(env['PUBLIC_URL']).addPath('admin', 'assets', depName);

				depsMapping[dep] = depUrl.toString({ rootRelative: true });
			} else {
				logger.warn(`Couldn't find shared extension dependency "${dep}"`);
			}
		}

		return depsMapping;
	}
}
