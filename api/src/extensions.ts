import {
	APP_EXTENSION_TYPES,
	APP_SHARED_DEPS,
	HYBRID_EXTENSION_TYPES,
	NESTED_EXTENSION_TYPES,
} from '@directus/shared/constants';
import * as sharedExceptions from '@directus/shared/exceptions';
import {
	ActionHandler,
	ApiExtension,
	BundleExtension,
	EndpointConfig,
	Extension,
	ExtensionInfo,
	ExtensionType,
	FilterHandler,
	HookConfig,
	HybridExtension,
	InitHandler,
	EmbedHandler,
	OperationApiConfig,
	ScheduleHandler,
} from '@directus/shared/types';
import {
	ensureExtensionDirs,
	generateExtensionsEntrypoint,
	getLocalExtensions,
	getPackageExtensions,
	pathToRelativeUrl,
	resolvePackage,
	resolvePackageExtensions,
} from '@directus/shared/utils/node';
import express, { Router } from 'express';
import fse from 'fs-extra';
import path from 'path';
import getDatabase from './database';
import emitter, { Emitter } from './emitter';
import env from './env';
import * as exceptions from './exceptions';
import logger from './logger';
import { dynamicImport } from './utils/dynamic-import';
import { getSchema } from './utils/get-schema';

import { isIn, isTypeIn, pluralize } from '@directus/shared/utils';
import alias from '@rollup/plugin-alias';
import virtual from '@rollup/plugin-virtual';
import chokidar, { FSWatcher } from 'chokidar';
import globby from 'globby';
import { clone, escapeRegExp } from 'lodash';
import { schedule, validate } from 'node-cron';
import { rollup } from 'rollup';
import { getFlowManager } from './flows';
import * as services from './services';
import { EventHandler } from './types';
import getModuleDefault from './utils/get-module-default';
import { JobQueue } from './utils/job-queue';
import { Url } from './utils/url';

let extensionManager: ExtensionManager | undefined;

export function getExtensionManager(): ExtensionManager {
	if (extensionManager) {
		return extensionManager;
	}

	extensionManager = new ExtensionManager();

	return extensionManager;
}

type BundleConfig = {
	endpoints: { name: string; config: EndpointConfig }[];
	hooks: { name: string; config: HookConfig }[];
	operations: { name: string; config: OperationApiConfig }[];
};

type AppExtensions = string | null;
type ApiExtensions = { path: string }[];

type Options = {
	schedule: boolean;
	watch: boolean;
};

const defaultOptions: Options = {
	schedule: true,
	watch: env.EXTENSIONS_AUTO_RELOAD && env.NODE_ENV !== 'development',
};

class ExtensionManager {
	private isLoaded = false;
	private options: Options;

	private extensions: Extension[] = [];

	private appExtensions: AppExtensions = null;
	private apiExtensions: ApiExtensions = [];

	private apiEmitter: Emitter;
	private hookEvents: EventHandler[] = [];
	private endpointRouter: Router;
	private hookEmbedsHead: string[] = [];
	private hookEmbedsBody: string[] = [];

	private reloadQueue: JobQueue;
	private watcher: FSWatcher | null = null;

	constructor() {
		this.options = defaultOptions;

		this.apiEmitter = new Emitter();
		this.endpointRouter = Router();

		this.reloadQueue = new JobQueue();
	}

	public async initialize(options: Partial<Options> = {}): Promise<void> {
		const prevOptions = this.options;

		this.options = {
			...defaultOptions,
			...options,
		};

		if (!prevOptions.watch && this.options.watch) {
			this.initializeWatcher();
		} else if (prevOptions.watch && !this.options.watch) {
			await this.closeWatcher();
		}

		if (!this.isLoaded) {
			await this.load();

			const loadedExtensions = this.getExtensionsList();
			if (loadedExtensions.length > 0) {
				logger.info(`Loaded extensions: ${loadedExtensions.map((ext) => ext.name).join(', ')}`);
			}
		}

		if (!prevOptions.watch && this.options.watch) {
			this.updateWatchedExtensions(this.extensions);
		}
	}

	public reload(): void {
		this.reloadQueue.enqueue(async () => {
			if (this.isLoaded) {
				logger.info('Reloading extensions');

				const prevExtensions = clone(this.extensions);

				await this.unload();
				await this.load();

				const added = this.extensions.filter(
					(extension) => !prevExtensions.some((prevExtension) => extension.path === prevExtension.path)
				);
				const removed = prevExtensions.filter(
					(prevExtension) => !this.extensions.some((extension) => prevExtension.path === extension.path)
				);

				this.updateWatchedExtensions(added, removed);

				const addedExtensions = added.map((extension) => extension.name);
				const removedExtensions = removed.map((extension) => extension.name);
				if (addedExtensions.length > 0) {
					logger.info(`Added extensions: ${addedExtensions.join(', ')}`);
				}
				if (removedExtensions.length > 0) {
					logger.info(`Removed extensions: ${removedExtensions.join(', ')}`);
				}
			} else {
				logger.warn('Extensions have to be loaded before they can be reloaded');
			}
		});
	}

	public getExtensionsList(type?: ExtensionType) {
		if (type === undefined) {
			return this.extensions.map(mapInfo);
		} else {
			return this.extensions.map(mapInfo).filter((extension) => extension.type === type);
		}

		function mapInfo(extension: Extension): ExtensionInfo {
			const extensionInfo = {
				name: extension.name,
				type: extension.type,
				local: extension.local,
				host: extension.host,
				version: extension.version,
			};

			if (extension.type === 'bundle') {
				return {
					...extensionInfo,
					entries: extension.entries.map((entry) => ({
						name: entry.name,
						type: entry.type,
					})),
				};
			} else {
				return extensionInfo as ExtensionInfo;
			}
		}
	}

	public getExtension(name: string): Extension | undefined {
		return this.extensions.find((extension) => extension.name === name);
	}

	public getAppExtensions(): string | null {
		return this.appExtensions;
	}

	public getEndpointRouter(): Router {
		return this.endpointRouter;
	}

	public getEmbeds() {
		return {
			head: wrapEmbeds('Custom Embed Head', this.hookEmbedsHead),
			body: wrapEmbeds('Custom Embed Body', this.hookEmbedsBody),
		};

		function wrapEmbeds(label: string, content: string[]): string {
			if (content.length === 0) return '';
			return `<!-- Start ${label} -->\n${content.join('\n')}\n<!-- End ${label} -->`;
		}
	}

	private async load(): Promise<void> {
		try {
			await ensureExtensionDirs(env.EXTENSIONS_PATH, NESTED_EXTENSION_TYPES);

			this.extensions = await this.getExtensions();
		} catch (err: any) {
			logger.warn(`Couldn't load extensions`);
			logger.warn(err);
		}

		await this.registerHooks();
		await this.registerEndpoints();
		await this.registerOperations();
		await this.registerBundles();

		if (env.SERVE_APP) {
			this.appExtensions = await this.generateExtensionBundle();
		}

		this.isLoaded = true;
	}

	private async unload(): Promise<void> {
		this.unregisterApiExtensions();

		this.apiEmitter.offAll();

		if (env.SERVE_APP) {
			this.appExtensions = null;
		}

		this.isLoaded = false;
	}

	private initializeWatcher(): void {
		if (!this.watcher) {
			logger.info('Watching extensions for changes...');

			const localExtensionPaths = NESTED_EXTENSION_TYPES.flatMap((type) => {
				const typeDir = path.posix.join(pathToRelativeUrl(env.EXTENSIONS_PATH), pluralize(type));

				if (isIn(type, HYBRID_EXTENSION_TYPES)) {
					return [path.posix.join(typeDir, '*', 'app.js'), path.posix.join(typeDir, '*', 'api.js')];
				} else {
					return path.posix.join(typeDir, '*', 'index.js');
				}
			});

			this.watcher = chokidar.watch([path.resolve('package.json'), ...localExtensionPaths], {
				ignoreInitial: true,
			});

			this.watcher
				.on('add', () => this.reload())
				.on('change', () => this.reload())
				.on('unlink', () => this.reload());
		}
	}

	private async closeWatcher(): Promise<void> {
		if (this.watcher) {
			await this.watcher.close();
		}
	}

	private updateWatchedExtensions(added: Extension[], removed: Extension[] = []): void {
		if (this.watcher) {
			const toPackageExtensionPaths = (extensions: Extension[]) =>
				extensions
					.filter((extension) => !extension.local)
					.flatMap((extension) =>
						isTypeIn(extension, HYBRID_EXTENSION_TYPES) || extension.type === 'bundle'
							? [
									path.resolve(extension.path, extension.entrypoint.app),
									path.resolve(extension.path, extension.entrypoint.api),
							  ]
							: path.resolve(extension.path, extension.entrypoint)
					);

			const addedPackageExtensionPaths = toPackageExtensionPaths(added);
			const removedPackageExtensionPaths = toPackageExtensionPaths(removed);

			this.watcher.add(addedPackageExtensionPaths);
			this.watcher.unwatch(removedPackageExtensionPaths);
		}
	}

	private async getExtensions(): Promise<Extension[]> {
		const packageExtensions = await getPackageExtensions('.');
		const localPackageExtensions = await resolvePackageExtensions(env.EXTENSIONS_PATH);
		const localExtensions = await getLocalExtensions(env.EXTENSIONS_PATH);

		return [...packageExtensions, ...localPackageExtensions, ...localExtensions].filter(
			(extension) => env.SERVE_APP || APP_EXTENSION_TYPES.includes(extension.type as any) === false
		);
	}

	private async generateExtensionBundle(): Promise<string | null> {
		const sharedDepsMapping = await this.getSharedDepsMapping(APP_SHARED_DEPS);
		const internalImports = Object.entries(sharedDepsMapping).map(([name, path]) => ({
			find: name,
			replacement: path,
		}));

		const entrypoint = generateExtensionsEntrypoint(this.extensions);

		try {
			const bundle = await rollup({
				input: 'entry',
				external: Object.values(sharedDepsMapping),
				makeAbsoluteExternalsRelative: false,
				plugins: [virtual({ entry: entrypoint }), alias({ entries: internalImports })],
			});
			const { output } = await bundle.generate({ format: 'es', compact: true });

			await bundle.close();

			return output[0].code;
		} catch (error: any) {
			logger.warn(`Couldn't bundle App extensions`);
			logger.warn(error);
		}

		return null;
	}

	private async getSharedDepsMapping(deps: string[]): Promise<Record<string, string>> {
		const appDir = await fse.readdir(path.join(resolvePackage('@directus/app', __dirname), 'dist', 'assets'));

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

	private async registerHooks(): Promise<void> {
		const hooks = this.extensions.filter((extension): extension is ApiExtension => extension.type === 'hook');
		for (const hook of hooks) {
			try {
				const hookPath = path.resolve(hook.path, hook.entrypoint);
				const hookInstance: HookConfig | { default: HookConfig } = await dynamicImport(hookPath);

				const config = getModuleDefault(hookInstance);

				this.registerHook(config);

				this.apiExtensions.push({ path: hookPath });
			} catch (error: any) {
				logger.warn(`Couldn't register hook "${hook.name}"`);
				logger.warn(error);
			}
		}
	}

	private async registerEndpoints(): Promise<void> {
		const endpoints = this.extensions.filter((extension): extension is ApiExtension => extension.type === 'endpoint');

		for (const endpoint of endpoints) {
			try {
				const endpointPath = path.resolve(endpoint.path, endpoint.entrypoint);
				const endpointInstance: EndpointConfig | { default: EndpointConfig } = require(endpointPath);

				const config = getModuleDefault(endpointInstance);

				this.registerEndpoint(config, endpoint.name);

				this.apiExtensions.push({ path: endpointPath });
			} catch (error: any) {
				logger.warn(`Couldn't register endpoint "${endpoint.name}"`);
				logger.warn(error);
			}
		}
	}

	private async registerOperations(): Promise<void> {
		const internalPaths = await globby(path.posix.join(pathToRelativeUrl(__dirname), 'operations/*/index.(js|ts)'));

		const internalOperations = internalPaths.map((internalPath) => {
			const dirs = internalPath.split(path.sep);

			return {
				name: dirs[dirs.length - 2],
				path: dirs.slice(0, -1).join(path.sep),
				entrypoint: { api: dirs[dirs.length - 1] },
			};
		});

		const operations = this.extensions.filter(
			(extension): extension is HybridExtension => extension.type === 'operation'
		);

		for (const operation of [...internalOperations, ...operations]) {
			try {
				const operationPath = path.resolve(operation.path, operation.entrypoint.api);
				const operationInstance: OperationApiConfig | { default: OperationApiConfig } = require(operationPath);

				const config = getModuleDefault(operationInstance);

				this.registerOperation(config);

				this.apiExtensions.push({ path: operationPath });
			} catch (error: any) {
				logger.warn(`Couldn't register operation "${operation.name}"`);
				logger.warn(error);
			}
		}
	}

	private async registerBundles(): Promise<void> {
		const bundles = this.extensions.filter((extension): extension is BundleExtension => extension.type === 'bundle');

		for (const bundle of bundles) {
			try {
				const bundlePath = path.resolve(bundle.path, bundle.entrypoint.api);
				const bundleInstances: BundleConfig | { default: BundleConfig } = require(bundlePath);

				const configs = getModuleDefault(bundleInstances);

				for (const { config } of configs.hooks) {
					this.registerHook(config);
				}

				for (const { config, name } of configs.endpoints) {
					this.registerEndpoint(config, name);
				}

				for (const { config } of configs.operations) {
					this.registerOperation(config);
				}

				this.apiExtensions.push({ path: bundlePath });
			} catch (error: any) {
				logger.warn(`Couldn't register bundle "${bundle.name}"`);
				logger.warn(error);
			}
		}
	}

	private registerHook(register: HookConfig): void {
		const registerFunctions = {
			filter: (event: string, handler: FilterHandler) => {
				emitter.onFilter(event, handler);

				this.hookEvents.push({
					type: 'filter',
					name: event,
					handler,
				});
			},
			action: (event: string, handler: ActionHandler) => {
				emitter.onAction(event, handler);

				this.hookEvents.push({
					type: 'action',
					name: event,
					handler,
				});
			},
			init: (event: string, handler: InitHandler) => {
				emitter.onInit(event, handler);

				this.hookEvents.push({
					type: 'init',
					name: event,
					handler,
				});
			},
			schedule: (cron: string, handler: ScheduleHandler) => {
				if (validate(cron)) {
					const task = schedule(cron, async () => {
						if (this.options.schedule) {
							try {
								await handler();
							} catch (error: any) {
								logger.error(error);
							}
						}
					});

					this.hookEvents.push({
						type: 'schedule',
						task,
					});
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
					this.hookEmbedsHead.push(content);
				}
				if (position === 'body') {
					this.hookEmbedsBody.push(content);
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

	private registerEndpoint(config: EndpointConfig, name: string): void {
		const register = typeof config === 'function' ? config : config.handler;
		const routeName = typeof config === 'function' ? name : config.id;

		const scopedRouter = express.Router();
		this.endpointRouter.use(`/${routeName}`, scopedRouter);

		register(scopedRouter, {
			services,
			exceptions: { ...exceptions, ...sharedExceptions },
			env,
			database: getDatabase(),
			emitter: this.apiEmitter,
			logger,
			getSchema,
		});
	}

	private registerOperation(config: OperationApiConfig): void {
		const flowManager = getFlowManager();

		flowManager.addOperation(config.id, config.handler);
	}

	private unregisterApiExtensions(): void {
		for (const event of this.hookEvents) {
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
					event.task.stop();
					break;
			}
		}

		this.hookEvents = [];

		this.endpointRouter.stack = [];

		const flowManager = getFlowManager();

		flowManager.clearOperations();

		for (const apiExtension of this.apiExtensions) {
			delete require.cache[require.resolve(apiExtension.path)];
		}

		this.apiExtensions = [];
	}
}
