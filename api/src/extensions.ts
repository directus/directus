import express, { Router } from 'express';
import path from 'path';
import { AppExtensionType, Extension, ExtensionType } from '@directus/shared/types';
import {
	ensureExtensionDirs,
	generateExtensionsEntry,
	getLocalExtensions,
	getPackageExtensions,
	resolvePackage,
} from '@directus/shared/utils/node';
import {
	API_EXTENSION_PACKAGE_TYPES,
	API_EXTENSION_TYPES,
	APP_EXTENSION_TYPES,
	APP_SHARED_DEPS,
	EXTENSION_PACKAGE_TYPES,
	EXTENSION_TYPES,
} from '@directus/shared/constants';
import getDatabase from './database';
import emitter, { Emitter } from './emitter';
import env from './env';
import * as exceptions from './exceptions';
import * as sharedExceptions from '@directus/shared/exceptions';
import logger from './logger';
import { HookConfig, EndpointConfig, FilterHandler, ActionHandler, InitHandler, ScheduleHandler } from './types';
import fse from 'fs-extra';
import { getSchema } from './utils/get-schema';

import * as services from './services';
import { schedule, ScheduledTask, validate } from 'node-cron';
import { rollup } from 'rollup';
// @TODO Remove this once a new version of @rollup/plugin-virtual has been released
// @ts-expect-error
import virtual from '@rollup/plugin-virtual';
import alias from '@rollup/plugin-alias';
import { Url } from './utils/url';
import getModuleDefault from './utils/get-module-default';
import { escapeRegExp } from 'lodash';

let extensionManager: ExtensionManager | undefined;

export function getExtensionManager(): ExtensionManager {
	if (extensionManager) {
		return extensionManager;
	}

	extensionManager = new ExtensionManager();

	return extensionManager;
}

class ExtensionManager {
	private isInitialized = false;

	private extensions: Extension[] = [];

	private appExtensions: Partial<Record<AppExtensionType, string>> = {};

	private apiHooks: (
		| { type: 'filter'; path: string; event: string; handler: FilterHandler }
		| { type: 'action'; path: string; event: string; handler: ActionHandler }
		| { type: 'init'; path: string; event: string; handler: InitHandler }
		| { type: 'schedule'; path: string; task: ScheduledTask }
	)[] = [];
	private apiEndpoints: { path: string }[] = [];

	private apiEmitter: Emitter;
	private endpointRouter: Router;

	private isScheduleHookEnabled = true;

	constructor() {
		this.apiEmitter = new Emitter();
		this.endpointRouter = Router();
	}

	public async initialize({ schedule } = { schedule: true }): Promise<void> {
		this.isScheduleHookEnabled = schedule;

		if (this.isInitialized) return;

		try {
			await ensureExtensionDirs(env.EXTENSIONS_PATH, env.SERVE_APP ? EXTENSION_TYPES : API_EXTENSION_TYPES);

			this.extensions = await this.getExtensions();
		} catch (err: any) {
			logger.warn(`Couldn't load extensions`);
			logger.warn(err);
		}

		this.registerHooks();
		this.registerEndpoints();

		if (env.SERVE_APP) {
			this.appExtensions = await this.generateExtensionBundles();
		}

		const loadedExtensions = this.listExtensions();
		if (loadedExtensions.length > 0) {
			logger.info(`Loaded extensions: ${loadedExtensions.join(', ')}`);
		}

		this.isInitialized = true;
	}

	public async reload(): Promise<void> {
		if (!this.isInitialized) return;

		logger.info('Reloading extensions');

		this.unregisterHooks();
		this.unregisterEndpoints();

		this.apiEmitter.offAll();

		if (env.SERVE_APP) {
			this.appExtensions = {};
		}

		this.isInitialized = false;
		await this.initialize();
	}

	public listExtensions(type?: ExtensionType): string[] {
		if (type === undefined) {
			return this.extensions.map((extension) => extension.name);
		} else {
			return this.extensions.filter((extension) => extension.type === type).map((extension) => extension.name);
		}
	}

	public getAppExtensions(type: AppExtensionType): string | undefined {
		return this.appExtensions[type];
	}

	public getEndpointRouter(): Router {
		return this.endpointRouter;
	}

	private async getExtensions(): Promise<Extension[]> {
		const packageExtensions = await getPackageExtensions(
			'.',
			env.SERVE_APP ? EXTENSION_PACKAGE_TYPES : API_EXTENSION_PACKAGE_TYPES
		);
		const localExtensions = await getLocalExtensions(
			env.EXTENSIONS_PATH,
			env.SERVE_APP ? EXTENSION_TYPES : API_EXTENSION_TYPES
		);

		return [...packageExtensions, ...localExtensions];
	}

	private async generateExtensionBundles() {
		const sharedDepsMapping = await this.getSharedDepsMapping(APP_SHARED_DEPS);
		const internalImports = Object.entries(sharedDepsMapping).map(([name, path]) => ({
			find: name,
			replacement: path,
		}));

		const bundles: Partial<Record<AppExtensionType, string>> = {};

		for (const extensionType of APP_EXTENSION_TYPES) {
			const entry = generateExtensionsEntry(extensionType, this.extensions);

			const bundle = await rollup({
				input: 'entry',
				external: Object.values(sharedDepsMapping),
				makeAbsoluteExternalsRelative: false,
				plugins: [virtual({ entry }), alias({ entries: internalImports })],
			});
			const { output } = await bundle.generate({ format: 'es', compact: true });

			bundles[extensionType] = output[0].code;

			await bundle.close();
		}

		return bundles;
	}

	private async getSharedDepsMapping(deps: string[]) {
		const appDir = await fse.readdir(path.join(resolvePackage('@directus/app'), 'dist', 'assets'));

		const depsMapping: Record<string, string> = {};
		for (const dep of deps) {
			const depRegex = new RegExp(`${escapeRegExp(dep.replace(/\//g, '_'))}\\.[0-9a-f]{8}\\.entry\\.js`);
			const depName = appDir.find((file) => depRegex.test(file));

			if (depName) {
				const depUrl = new Url(env.PUBLIC_URL).addPath('admin', 'assets', depName);

				depsMapping[dep] = depUrl.toString({ rootRelative: true });
			} else {
				logger.warn(`Couldn't find shared extension dependency "${dep}"`);
			}
		}

		return depsMapping;
	}

	private registerHooks(): void {
		const hooks = this.extensions.filter((extension) => extension.type === 'hook');

		for (const hook of hooks) {
			try {
				this.registerHook(hook);
			} catch (error: any) {
				logger.warn(`Couldn't register hook "${hook.name}"`);
				logger.warn(error);
			}
		}
	}

	private registerEndpoints(): void {
		const endpoints = this.extensions.filter((extension) => extension.type === 'endpoint');

		for (const endpoint of endpoints) {
			try {
				this.registerEndpoint(endpoint, this.endpointRouter);
			} catch (error: any) {
				logger.warn(`Couldn't register endpoint "${endpoint.name}"`);
				logger.warn(error);
			}
		}
	}

	private registerHook(hook: Extension) {
		const hookPath = path.resolve(hook.path, hook.entrypoint || '');
		const hookInstance: HookConfig | { default: HookConfig } = require(hookPath);

		const register = getModuleDefault(hookInstance);

		const registerFunctions = {
			filter: (event: string, handler: FilterHandler) => {
				emitter.onFilter(event, handler);

				this.apiHooks.push({
					type: 'filter',
					path: hookPath,
					event,
					handler,
				});
			},
			action: (event: string, handler: ActionHandler) => {
				emitter.onAction(event, handler);

				this.apiHooks.push({
					type: 'action',
					path: hookPath,
					event,
					handler,
				});
			},
			init: (event: string, handler: InitHandler) => {
				emitter.onInit(event, handler);

				this.apiHooks.push({
					type: 'init',
					path: hookPath,
					event,
					handler,
				});
			},
			schedule: (cron: string, handler: ScheduleHandler) => {
				if (validate(cron)) {
					const task = schedule(cron, async () => {
						if (this.isScheduleHookEnabled) {
							try {
								await handler();
							} catch (error: any) {
								logger.error(error);
							}
						}
					});

					this.apiHooks.push({
						type: 'schedule',
						path: hookPath,
						task,
					});
				} else {
					logger.warn(`Couldn't register cron hook. Provided cron is invalid: ${cron}`);
				}
			},
		};

		register(registerFunctions, {
			services,
			exceptions: { ...exceptions, ...sharedExceptions },
			env,
			database: getDatabase(),
			emitter: this.apiEmitter,
			logger,
			getSchema,
		});
	}

	private registerEndpoint(endpoint: Extension, router: Router) {
		const endpointPath = path.resolve(endpoint.path, endpoint.entrypoint || '');
		const endpointInstance: EndpointConfig | { default: EndpointConfig } = require(endpointPath);

		const mod = getModuleDefault(endpointInstance);

		const register = typeof mod === 'function' ? mod : mod.handler;
		const routeName = typeof mod === 'function' ? endpoint.name : mod.id;

		const scopedRouter = express.Router();
		router.use(`/${routeName}`, scopedRouter);

		register(scopedRouter, {
			services,
			exceptions: { ...exceptions, ...sharedExceptions },
			env,
			database: getDatabase(),
			emitter: this.apiEmitter,
			logger,
			getSchema,
		});

		this.apiEndpoints.push({
			path: endpointPath,
		});
	}

	private unregisterHooks(): void {
		for (const hook of this.apiHooks) {
			switch (hook.type) {
				case 'filter':
					emitter.offFilter(hook.event, hook.handler);
					break;
				case 'action':
					emitter.offAction(hook.event, hook.handler);
					break;
				case 'init':
					emitter.offInit(hook.event, hook.handler);
					break;
				case 'schedule':
					hook.task.destroy();
					break;
			}

			delete require.cache[require.resolve(hook.path)];
		}

		this.apiHooks = [];
	}

	private unregisterEndpoints(): void {
		for (const endpoint of this.apiEndpoints) {
			delete require.cache[require.resolve(endpoint.path)];
		}

		this.endpointRouter.stack = [];

		this.apiEndpoints = [];
	}
}
