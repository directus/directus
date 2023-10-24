import { JAVASCRIPT_FILE_EXTS } from '@directus/constants';
import type {
	ApiExtension,
	BundleExtension,
	EndpointConfig,
	Extension,
	ExtensionSettings,
	HookConfig,
	HybridExtension,
	OperationApiConfig,
} from '@directus/extensions';
import { APP_SHARED_DEPS, HYBRID_EXTENSION_TYPES, NESTED_EXTENSION_TYPES } from '@directus/extensions';
import { ensureExtensionDirs, generateExtensionsEntrypoint } from '@directus/extensions/node';
import type {
	ActionHandler,
	EmbedHandler,
	FilterHandler,
	InitHandler,
	PromiseCallback,
	ScheduleHandler,
} from '@directus/types';
import { isIn, isTypeIn, pluralize } from '@directus/utils';
import { pathToRelativeUrl } from '@directus/utils/node';
import aliasDefault from '@rollup/plugin-alias';
import nodeResolveDefault from '@rollup/plugin-node-resolve';
import virtualDefault from '@rollup/plugin-virtual';
import chokidar, { FSWatcher } from 'chokidar';
import express, { Router } from 'express';
import ivm from 'isolated-vm';
import { clone } from 'lodash-es';
import { readFile, readdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import path from 'path';
import { rollup } from 'rollup';
import getDatabase from '../database/index.js';
import emitter, { Emitter } from '../emitter.js';
import env from '../env.js';
import { getFlowManager } from '../flows.js';
import logger from '../logger.js';
import * as services from '../services/index.js';
import { deleteFromRequireCache } from '../utils/delete-from-require-cache.js';
import getModuleDefault from '../utils/get-module-default.js';
import { getSchema } from '../utils/get-schema.js';
import { importFileUrl } from '../utils/import-file-url.js';
import { JobQueue } from '../utils/job-queue.js';
import { scheduleSynchronizedJob, validateCron } from '../utils/schedule.js';
import { getExtensionsSettings } from './lib/get-extensions-settings.js';
import { getExtensions } from './lib/get-extensions.js';
import { getSharedDepsMapping } from './lib/get-shared-deps-mapping.js';
import { generateApiExtensionsSandboxEntrypoint } from './lib/sandbox/generate-api-extensions-sandbox-entrypoint.js';
import { instantiateSandboxSdk } from './lib/sandbox/sdk/instantiate.js';
import { wrapEmbeds } from './lib/wrap-embeds.js';
import type { BundleConfig, ExtensionManagerOptions } from './types.js';

// Workaround for https://github.com/rollup/plugins/issues/1329
const virtual = virtualDefault as unknown as typeof virtualDefault.default;
const alias = aliasDefault as unknown as typeof aliasDefault.default;
const nodeResolve = nodeResolveDefault as unknown as typeof nodeResolveDefault.default;

const __dirname = dirname(fileURLToPath(import.meta.url));

export class ExtensionManager {
	private options: ExtensionManagerOptions = {
		schedule: true,
		watch: env['EXTENSIONS_AUTO_RELOAD'] && env['NODE_ENV'] !== 'development',
	};

	/**
	 * Whether or not the extensions have been read from disk and registered into the system
	 */
	private isLoaded = false;

	/**
	 * All extensions that are loaded within the current process
	 */
	private extensions: Extension[] = [];

	/**
	 * Settings for the extensions that are loaded within the current process
	 */
	private extensionsSettings: ExtensionSettings[] = [];

	/**
	 * App extensions rolled up into a single bundle. Any chunks from the bundle will be available
	 * under appExtensionChunks
	 */
	private appExtensionsBundle: string | null = null;

	/**
	 * Individual filename chunks from the rollup bundle. Used to improve the performance by allowing
	 * extensions to split up their bundle into multiple smaller chunks
	 */
	private appExtensionChunks: Map<string, string> = new Map();

	/**
	 * Callbacks to be able to unregister extensions
	 */
	private unregisterFunctionMap: Map<string, PromiseCallback> = new Map();

	/**
	 * A local-to-extensions scoped emitter that can be used to fire and listen to custom events
	 * between extensions. These events are completely isolated from the core events that trigger
	 * hooks etc
	 */
	private localEmitter: Emitter = new Emitter();

	/**
	 * Locally scoped express router used for custom endpoints. Allows extensions to dynamically
	 * register and de-register endpoints without affecting the regular global router
	 */
	private endpointRouter: Router = Router();

	/**
	 * Custom HTML to be injected at the end of the `<head>` tag of the app's index.html
	 */
	private hookEmbedsHead: string[] = [];

	/**
	 * Custom HTML to be injected at the end of the `<body>` tag of the app's index.html
	 */
	private hookEmbedsBody: string[] = [];

	/**
	 * Used to prevent race conditions when reloading extensions. Forces each reload to happen in
	 * sequence.
	 */
	private reloadQueue: JobQueue = new JobQueue();

	/**
	 * Optional file system watcher to auto-reload extensions when the local file system changes
	 */
	private watcher: FSWatcher | null = null;

	/**
	 * Load and register all extensions
	 *
	 * @param {ExtensionManagerOptions} options - Extension manager configuration options
	 * @param {boolean} options.schedule - Whether or not to allow for scheduled (CRON) hook extensions
	 * @param {boolean} options.watch - Whether or not to watch the local extensions folder for changes
	 */
	public async initialize(options: Partial<ExtensionManagerOptions> = {}): Promise<void> {
		if (options.schedule !== undefined) {
			this.options.schedule = options.schedule;
		}

		if (options.watch !== undefined) {
			this.options.watch = options.watch;
		}

		const wasWatcherInitialized = this.watcher !== null;

		if (this.options.watch && !wasWatcherInitialized) {
			this.initializeWatcher();
		} else if (!this.options.watch && wasWatcherInitialized) {
			await this.closeWatcher();
		}

		if (!this.isLoaded) {
			await this.load();

			if (this.extensions.length > 0) {
				logger.info(`Loaded extensions: ${this.extensions.map((ext) => ext.name).join(', ')}`);
			}
		}

		if (this.options.watch && !wasWatcherInitialized) {
			this.updateWatchedExtensions(this.extensions);
		}
	}

	/**
	 * Load all extensions from disk and register them in their respective places
	 */
	private async load(): Promise<void> {
		try {
			await ensureExtensionDirs(env['EXTENSIONS_PATH'], NESTED_EXTENSION_TYPES);

			this.extensions = await getExtensions();
			this.extensionsSettings = await getExtensionsSettings(this.extensions);
		} catch (err: any) {
			logger.warn(`Couldn't load extensions`);
			logger.warn(err);
		}

		await this.registerHooks();
		await this.registerEndpoints();
		await this.registerOperations();
		await this.registerBundles();

		if (env['SERVE_APP']) {
			this.appExtensionsBundle = await this.generateExtensionBundle();
		}

		this.isLoaded = true;
	}

	/**
	 * Unregister all extensions from the current process
	 */
	private async unload(): Promise<void> {
		await this.unregisterApiExtensions();

		this.localEmitter.offAll();

		this.appExtensionsBundle = null;

		this.isLoaded = false;
	}

	/**
	 * Reload all the extensions. Will unload if extensions have already been loaded
	 */
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

	/**
	 * Return the previously generated app extensions bundle
	 */
	public getAppExtensionsBundle(): string | null {
		return this.appExtensionsBundle;
	}

	/**
	 * Return the previously generated app extension bundle chunk by name
	 */
	public getAppExtensionChunk(name: string): string | null {
		return this.appExtensionChunks.get(name) ?? null;
	}

	/**
	 * Return the scoped router for custom endpoints
	 */
	public getEndpointRouter(): Router {
		return this.endpointRouter;
	}

	/**
	 * Return the custom HTML head and body embeds wrapped in a marker comment
	 */
	public getEmbeds() {
		return {
			head: wrapEmbeds('Custom Embed Head', this.hookEmbedsHead),
			body: wrapEmbeds('Custom Embed Body', this.hookEmbedsBody),
		};
	}

	/**
	 * Allow reading the installed extensions
	 */
	public getExtensions() {
		return this.extensions;
	}

	/**
	 * Start the chokidar watcher for extensions on the local filesystem
	 */
	private initializeWatcher(): void {
		logger.info('Watching extensions for changes...');

		const extensionDirUrl = pathToRelativeUrl(env['EXTENSIONS_PATH']);

		const localExtensionUrls = NESTED_EXTENSION_TYPES.flatMap((type) => {
			const typeDir = path.posix.join(extensionDirUrl, pluralize(type));

			if (isIn(type, HYBRID_EXTENSION_TYPES)) {
				return [
					path.posix.join(typeDir, '*', `app.{${JAVASCRIPT_FILE_EXTS.join()}}`),
					path.posix.join(typeDir, '*', `api.{${JAVASCRIPT_FILE_EXTS.join()}}`),
				];
			} else {
				return path.posix.join(typeDir, '*', `index.{${JAVASCRIPT_FILE_EXTS.join()}}`);
			}
		});

		this.watcher = chokidar.watch(
			[path.resolve('package.json'), path.posix.join(extensionDirUrl, '*', 'package.json'), ...localExtensionUrls],
			{
				ignoreInitial: true,
			}
		);

		this.watcher
			.on('add', () => this.reload())
			.on('change', () => this.reload())
			.on('unlink', () => this.reload());
	}

	/**
	 * Close and destroy the local filesystem watcher if enabled
	 */
	private async closeWatcher(): Promise<void> {
		if (this.watcher) {
			await this.watcher.close();

			this.watcher = null;
		}
	}

	/**
	 * Update the chokidar watcher configuration when new extensions are added or existing ones
	 * removed
	 */
	private updateWatchedExtensions(added: Extension[], removed: Extension[] = []): void {
		if (this.watcher) {
			const toPackageExtensionPaths = (extensions: Extension[]) =>
				extensions
					.filter((extension) => !extension.local || extension.type === 'bundle')
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

	/**
	 * Uses rollup to bundle the app extensions together into a single file the app can download and
	 * run.
	 */
	private async generateExtensionBundle(): Promise<string | null> {
		const sharedDepsMapping = await getSharedDepsMapping(APP_SHARED_DEPS);

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

	private async registerSandboxedApiExtension(extension: ApiExtension | HybridExtension) {
		const sandboxMemory = Number(env['EXTENSIONS_SANDBOX_MEMORY']);
		const sandboxTimeout = Number(env['EXTENSIONS_SANDBOX_TIMEOUT']);

		const entrypointPath = path.resolve(
			extension.path,
			isTypeIn(extension, HYBRID_EXTENSION_TYPES) ? extension.entrypoint.api : extension.entrypoint
		);

		const extensionCode = await readFile(entrypointPath, 'utf-8');

		const isolate = new ivm.Isolate({
			memoryLimit: sandboxMemory,
			onCatastrophicError: (e) => {
				logger.error(`Error in API extension sandbox of ${extension.type} "${extension.name}"`);
				logger.error(e);

				process.abort();
			},
		});

		const context = await isolate.createContext();

		const module = await isolate.compileModule(extensionCode, { filename: `file://${entrypointPath}` });

		const sdkModule = await instantiateSandboxSdk(isolate, extension.sandbox?.requestedScopes ?? {});

		await module.instantiate(context, (specifier) => {
			if (specifier !== 'directus:api') {
				throw new Error('Imports other than "directus:api" are prohibited in API extension sandboxes');
			}

			return sdkModule;
		});

		await module.evaluate({ timeout: sandboxTimeout });

		const cb = await module.namespace.get('default', { reference: true });

		const { code, hostFunctions, unregisterFunction } = generateApiExtensionsSandboxEntrypoint(
			extension.type,
			extension.name,
			this.endpointRouter
		);

		await context.evalClosure(code, [cb, ...hostFunctions.map((fn) => new ivm.Reference(fn))], {
			timeout: sandboxTimeout,
			filename: '<extensions-sandbox>',
		});

		this.unregisterFunctionMap.set(extension.name, async () => {
			await unregisterFunction();

			isolate.dispose();
		});
	}

	/**
	 * Import the hook module code for all hook extensions, and register them individually through
	 * registerHook
	 */
	private async registerHooks(): Promise<void> {
		const hooks = this.extensions.filter((extension): extension is ApiExtension => extension.type === 'hook');

		for (const hook of hooks) {
			const { enabled } = this.extensionsSettings.find(({ name }) => name === hook.name) ?? { enabled: false };

			if (!enabled) continue;

			try {
				if (hook.sandbox?.enabled) {
					await this.registerSandboxedApiExtension(hook);
				} else {
					const hookPath = path.resolve(hook.path, hook.entrypoint);

					const hookInstance: HookConfig | { default: HookConfig } = await importFileUrl(hookPath, import.meta.url, {
						fresh: true,
					});

					const config = getModuleDefault(hookInstance);

					const unregisterFunctions = this.registerHook(config, hook.name);

					this.unregisterFunctionMap.set(hook.name, async () => {
						await Promise.all(unregisterFunctions.map((fn) => fn()));

						deleteFromRequireCache(hookPath);
					});
				}
			} catch (error: any) {
				logger.warn(`Couldn't register hook "${hook.name}"`);
				logger.warn(error);
			}
		}
	}

	/**
	 * Import the endpoint module code for all endpoint extensions, and register them individually through
	 * registerEndpoint
	 */
	private async registerEndpoints(): Promise<void> {
		const endpoints = this.extensions.filter((extension): extension is ApiExtension => extension.type === 'endpoint');

		for (const endpoint of endpoints) {
			const { enabled } = this.extensionsSettings.find(({ name }) => name === endpoint.name) ?? { enabled: false };

			if (!enabled) continue;

			try {
				if (endpoint.sandbox?.enabled) {
					await this.registerSandboxedApiExtension(endpoint);
				} else {
					const endpointPath = path.resolve(endpoint.path, endpoint.entrypoint);

					const endpointInstance: EndpointConfig | { default: EndpointConfig } = await importFileUrl(
						endpointPath,
						import.meta.url,
						{
							fresh: true,
						}
					);

					const config = getModuleDefault(endpointInstance);

					const unregister = this.registerEndpoint(config, endpoint.name);

					this.unregisterFunctionMap.set(endpoint.name, async () => {
						await unregister();

						deleteFromRequireCache(endpointPath);
					});
				}
			} catch (error: any) {
				logger.warn(`Couldn't register endpoint "${endpoint.name}"`);
				logger.warn(error);
			}
		}
	}

	/**
	 * Import the operation module code for all operation extensions, and register them individually through
	 * registerOperation
	 */
	private async registerOperations(): Promise<void> {
		const internalOperations = await readdir(path.join(__dirname, '..', 'operations'));

		for (const operation of internalOperations) {
			const operationInstance: OperationApiConfig | { default: OperationApiConfig } = await import(
				`../operations/${operation}/index.js`
			);

			const config = getModuleDefault(operationInstance);

			this.registerOperation(config);
		}

		const operations = this.extensions.filter(
			(extension): extension is HybridExtension => extension.type === 'operation'
		);

		for (const operation of operations) {
			const { enabled } = this.extensionsSettings.find(({ name }) => name === operation.name) ?? { enabled: false };

			if (!enabled) continue;

			try {
				if (operation.sandbox?.enabled) {
					await this.registerSandboxedApiExtension(operation);
				} else {
					const operationPath = path.resolve(operation.path, operation.entrypoint.api!);

					const operationInstance: OperationApiConfig | { default: OperationApiConfig } = await importFileUrl(
						operationPath,
						import.meta.url,
						{
							fresh: true,
						}
					);

					const config = getModuleDefault(operationInstance);

					const unregister = this.registerOperation(config);

					this.unregisterFunctionMap.set(operation.name, async () => {
						await unregister();

						deleteFromRequireCache(operationPath);
					});
				}
			} catch (error: any) {
				logger.warn(`Couldn't register operation "${operation.name}"`);
				logger.warn(error);
			}
		}
	}

	/**
	 * Import the module code for all hook, endpoint, and operation extensions registered within a
	 * bundle, and register them with their respective registration function
	 */
	private async registerBundles(): Promise<void> {
		const bundles = this.extensions.filter((extension): extension is BundleExtension => extension.type === 'bundle');

		for (const bundle of bundles) {
			try {
				const bundlePath = path.resolve(bundle.path, bundle.entrypoint.api);

				const bundleInstances: BundleConfig | { default: BundleConfig } = await importFileUrl(
					bundlePath,
					import.meta.url,
					{
						fresh: true,
					}
				);

				const configs = getModuleDefault(bundleInstances);

				const unregisterFunctions: PromiseCallback[] = [];

				for (const { config, name } of configs.hooks) {
					const unregisters = this.registerHook(config, name);

					unregisterFunctions.push(...unregisters);
				}

				for (const { config, name } of configs.endpoints) {
					const unregister = this.registerEndpoint(config, name);

					unregisterFunctions.push(unregister);
				}

				for (const { config } of configs.operations) {
					const unregister = this.registerOperation(config);

					unregisterFunctions.push(unregister);
				}

				this.unregisterFunctionMap.set(bundle.name, async () => {
					await Promise.all(unregisterFunctions.map((fn) => fn()));

					deleteFromRequireCache(bundlePath);
				});
			} catch (error: any) {
				logger.warn(`Couldn't register bundle "${bundle.name}"`);
				logger.warn(error);
			}
		}
	}

	/**
	 * Register a single hook
	 */
	private registerHook(hookRegistrationCallback: HookConfig, name: string): PromiseCallback[] {
		let scheduleIndex = 0;

		const unregisterFunctions: PromiseCallback[] = [];

		const hookRegistrationContext = {
			filter: (event: string, handler: FilterHandler) => {
				emitter.onFilter(event, handler);

				unregisterFunctions.push(() => {
					emitter.offFilter(event, handler);
				});
			},
			action: (event: string, handler: ActionHandler) => {
				emitter.onAction(event, handler);

				unregisterFunctions.push(() => {
					emitter.offAction(event, handler);
				});
			},
			init: (event: string, handler: InitHandler) => {
				emitter.onInit(event, handler);

				unregisterFunctions.push(() => {
					emitter.offInit(name, handler);
				});
			},
			schedule: (cron: string, handler: ScheduleHandler) => {
				if (validateCron(cron)) {
					const job = scheduleSynchronizedJob(`${name}:${scheduleIndex}`, cron, async () => {
						if (this.options.schedule) {
							try {
								await handler();
							} catch (error: any) {
								logger.error(error);
							}
						}
					});

					scheduleIndex++;

					unregisterFunctions.push(async () => {
						await job.stop();
					});
				} else {
					logger.warn(`Couldn't register cron hook. Provided cron is invalid: ${cron}`);
				}
			},
			embed: (position: 'head' | 'body', code: string | EmbedHandler) => {
				const content = typeof code === 'function' ? code() : code;

				if (content.trim().length !== 0) {
					if (position === 'head') {
						const index = this.hookEmbedsHead.length;

						this.hookEmbedsHead.push(content);

						unregisterFunctions.push(() => {
							this.hookEmbedsHead.splice(index, 1);
						});
					} else {
						const index = this.hookEmbedsBody.length;

						this.hookEmbedsBody.push(content);

						unregisterFunctions.push(() => {
							this.hookEmbedsBody.splice(index, 1);
						});
					}
				} else {
					logger.warn(`Couldn't register embed hook. Provided code is empty!`);
				}
			},
		};

		hookRegistrationCallback(hookRegistrationContext, {
			services,
			env,
			database: getDatabase(),
			emitter: this.localEmitter,
			logger,
			getSchema,
		});

		return unregisterFunctions;
	}

	/**
	 * Register an individual endpoint
	 */
	private registerEndpoint(config: EndpointConfig, name: string): PromiseCallback {
		const endpointRegistrationCallback = typeof config === 'function' ? config : config.handler;
		const routeName = typeof config === 'function' ? name : config.id;

		const scopedRouter = express.Router();

		this.endpointRouter.use(`/${routeName}`, scopedRouter);

		endpointRegistrationCallback(scopedRouter, {
			services,
			env,
			database: getDatabase(),
			emitter: this.localEmitter,
			logger,
			getSchema,
		});

		const unregisterFunction = () => {
			this.endpointRouter.stack = this.endpointRouter.stack.filter((layer) => scopedRouter !== layer.handle);
		};

		return unregisterFunction;
	}

	/**
	 * Register an individual operation
	 */
	private registerOperation(config: OperationApiConfig): PromiseCallback {
		const flowManager = getFlowManager();

		flowManager.addOperation(config.id, config.handler);

		const unregisterFunction = () => {
			flowManager.removeOperation(config.id);
		};

		return unregisterFunction;
	}

	/**
	 * Remove the registration for all API extensions
	 */
	private async unregisterApiExtensions(): Promise<void> {
		const unregisterFunctions = Array.from(this.unregisterFunctionMap.values());

		await Promise.all(unregisterFunctions.map((fn) => fn()));
	}
}
