import { useEnv } from '@directus/env';
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
import { APP_SHARED_DEPS, HYBRID_EXTENSION_TYPES } from '@directus/extensions';
import { generateExtensionsEntrypoint } from '@directus/extensions/node';
import type {
	ActionHandler,
	EmbedHandler,
	FilterHandler,
	InitHandler,
	PromiseCallback,
	ScheduleHandler,
} from '@directus/types';
import { isTypeIn, toBoolean } from '@directus/utils';
import { pathToRelativeUrl, processId } from '@directus/utils/node';
import aliasDefault from '@rollup/plugin-alias';
import nodeResolveDefault from '@rollup/plugin-node-resolve';
import virtualDefault from '@rollup/plugin-virtual';
import chokidar, { FSWatcher } from 'chokidar';
import express, { Router } from 'express';
import ivm from 'isolated-vm';
import { clone, debounce, isPlainObject } from 'lodash-es';
import { readFile, readdir } from 'node:fs/promises';
import os from 'node:os';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import path from 'path';
import { rollup } from 'rollup';
import { useBus } from '../bus/index.js';
import getDatabase from '../database/index.js';
import emitter, { Emitter } from '../emitter.js';
import { getFlowManager } from '../flows.js';
import { useLogger } from '../logger/index.js';
import * as services from '../services/index.js';
import { deleteFromRequireCache } from '../utils/delete-from-require-cache.js';
import getModuleDefault from '../utils/get-module-default.js';
import { getSchema } from '../utils/get-schema.js';
import { importFileUrl } from '../utils/import-file-url.js';
import { JobQueue } from '../utils/job-queue.js';
import { scheduleSynchronizedJob, validateCron } from '../utils/schedule.js';
import { getExtensionsPath } from './lib/get-extensions-path.js';
import { getExtensionsSettings } from './lib/get-extensions-settings.js';
import { getExtensions } from './lib/get-extensions.js';
import { getSharedDepsMapping } from './lib/get-shared-deps-mapping.js';
import { getInstallationManager } from './lib/installation/index.js';
import type { InstallationManager } from './lib/installation/manager.js';
import { generateApiExtensionsSandboxEntrypoint } from './lib/sandbox/generate-api-extensions-sandbox-entrypoint.js';
import { instantiateSandboxSdk } from './lib/sandbox/sdk/instantiate.js';
import { syncExtensions } from './lib/sync-extensions.js';
import { wrapEmbeds } from './lib/wrap-embeds.js';
import type { BundleConfig, ExtensionManagerOptions } from './types.js';

// Workaround for https://github.com/rollup/plugins/issues/1329
const virtual = virtualDefault as unknown as typeof virtualDefault.default;
const alias = aliasDefault as unknown as typeof aliasDefault.default;
const nodeResolve = nodeResolveDefault as unknown as typeof nodeResolveDefault.default;

const __dirname = dirname(fileURLToPath(import.meta.url));

const env = useEnv();

const defaultOptions: ExtensionManagerOptions = {
	schedule: true,
	watch: env['EXTENSIONS_AUTO_RELOAD'] as boolean,
};

export class ExtensionManager {
	private options: ExtensionManagerOptions = defaultOptions;

	/**
	 * Whether or not the extensions have been read from disk and registered into the system
	 */
	private isLoaded = false;

	// folder:Extension
	private localExtensions: Map<string, Extension> = new Map();

	// versionId:Extension
	private registryExtensions: Map<string, Extension> = new Map();

	// name:Extension
	private moduleExtensions: Map<string, Extension> = new Map();

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
	 * installation manager responsible for installing extensions from registries
	 */

	private installationManager: InstallationManager = getInstallationManager();

	private messenger = useBus();

	/**
	 * channel to publish on registering extension from external registry
	 */
	private reloadChannel = `extensions.reload`;

	private processId = processId();

	public get extensions() {
		return [...this.localExtensions.values(), ...this.registryExtensions.values(), ...this.moduleExtensions.values()];
	}

	public getExtension(source: string, folder: string) {
		switch (source) {
			case 'module':
				return this.moduleExtensions.get(folder);
			case 'registry':
				return this.registryExtensions.get(folder);
			case 'local':
				return this.localExtensions.get(folder);
		}

		return undefined;
	}

	/**
	 * Load and register all extensions
	 *
	 * @param {ExtensionManagerOptions} options - Extension manager configuration options
	 * @param {boolean} options.schedule - Whether or not to allow for scheduled (CRON) hook extensions
	 * @param {boolean} options.watch - Whether or not to watch the local extensions folder for changes
	 */
	public async initialize(options: Partial<ExtensionManagerOptions> = {}): Promise<void> {
		const logger = useLogger();

		this.options = {
			...defaultOptions,
			...options,
		};

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
			this.updateWatchedExtensions([...this.extensions]);
		}

		this.messenger.subscribe(this.reloadChannel, (payload: Record<string, unknown>) => {
			// Ignore requests for reloading that were published by the current process
			if (isPlainObject(payload) && 'origin' in payload && payload['origin'] === this.processId) return;
			this.reload();
		});
	}

	/**
	 * Installs an external extension from registry
	 */
	public async install(versionId: string): Promise<void> {
		await this.installationManager.install(versionId);
		await this.reload({ forceSync: true });
		await this.broadcastReloadNotification();
	}

	public async uninstall(folder: string) {
		await this.installationManager.uninstall(folder);
		await this.reload({ forceSync: true });
		await this.broadcastReloadNotification();
	}

	public async broadcastReloadNotification() {
		await this.messenger.publish(this.reloadChannel, { origin: this.processId });
	}

	/**
	 * Load all extensions from disk and register them in their respective places
	 */
	private async load(options?: { forceSync: boolean }): Promise<void> {
		const logger = useLogger();

		if (env['EXTENSIONS_LOCATION']) {
			try {
				await syncExtensions({ force: options?.forceSync ?? false });
			} catch (error) {
				logger.error(`Failed to sync extensions`);
				logger.error(error);
				process.exit(1);
			}
		}

		try {
			const { local, registry, module } = await getExtensions();

			this.localExtensions = local;
			this.registryExtensions = registry;
			this.moduleExtensions = module;

			this.extensionsSettings = await getExtensionsSettings({ local, registry, module });
		} catch (error) {
			this.handleExtensionError({ error, reason: `Couldn't load extensions` });
		}

		await Promise.all([this.registerInternalOperations(), this.registerApiExtensions()]);

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
	public reload(options?: { forceSync: boolean }): Promise<unknown> {
		if (this.reloadQueue.size > 0) {
			// The pending job in the queue will already handle the additional changes
			return Promise.resolve();
		}

		const logger = useLogger();

		let resolve: (val?: unknown) => void;
		let reject: (val?: unknown) => void;

		const promise = new Promise((res, rej) => {
			resolve = res;
			reject = rej;
		});

		this.reloadQueue.enqueue(async () => {
			if (this.isLoaded) {
				const prevExtensions = clone(this.extensions);

				await this.unload();
				await this.load(options);

				logger.info('Extensions reloaded');

				const added = this.extensions.filter(
					(extension) => !prevExtensions.some((prevExtension) => extension.path === prevExtension.path),
				);

				const removed = prevExtensions.filter(
					(prevExtension) => !this.extensions.some((extension) => prevExtension.path === extension.path),
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

				resolve();
			} else {
				logger.warn('Extensions have to be loaded before they can be reloaded');
				reject(new Error('Extensions have to be loaded before they can be reloaded'));
			}
		});

		return promise;
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
	 * Start the chokidar watcher for extensions on the local filesystem
	 */
	private initializeWatcher(): void {
		const logger = useLogger();

		logger.info('Watching extensions for changes...');

		const extensionDirUrl = pathToRelativeUrl(getExtensionsPath());

		this.watcher = chokidar.watch(
			[path.resolve('package.json'), path.posix.join(extensionDirUrl, '*', 'package.json')],
			{
				ignoreInitial: true,
				// dotdirs are watched by default and frequently found in 'node_modules'
				ignored: `${extensionDirUrl}/**/node_modules/**`,
				// on macOS dotdirs in linked extensions are watched too
				followSymlinks: os.platform() === 'darwin' ? false : true,
			},
		);

		this.watcher
			.on(
				'add',
				debounce(() => this.reload(), 500),
			)
			.on(
				'change',
				debounce(() => this.reload(), 650),
			)
			.on(
				'unlink',
				debounce(() => this.reload(), 2000),
			);
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
		if (!this.watcher) return;

		const extensionDir = path.resolve(getExtensionsPath());
		const registryDir = path.join(extensionDir, '.registry');

		const toPackageExtensionPaths = (extensions: Extension[]) =>
			extensions
				.filter((extension) => extension.local && !extension.path.startsWith(registryDir))
				.flatMap((extension) =>
					isTypeIn(extension, HYBRID_EXTENSION_TYPES) || extension.type === 'bundle'
						? [
								path.resolve(extension.path, extension.entrypoint.app),
								path.resolve(extension.path, extension.entrypoint.api),
						  ]
						: path.resolve(extension.path, extension.entrypoint),
				);

		this.watcher.add(toPackageExtensionPaths(added));
		this.watcher.unwatch(toPackageExtensionPaths(removed));
	}

	/**
	 * Uses rollup to bundle the app extensions together into a single file the app can download and
	 * run.
	 */
	private async generateExtensionBundle(): Promise<string | null> {
		const logger = useLogger();

		const sharedDepsMapping = await getSharedDepsMapping(APP_SHARED_DEPS);

		const internalImports = Object.entries(sharedDepsMapping).map(([name, path]) => ({
			find: name,
			replacement: path,
		}));

		const entrypoint = generateExtensionsEntrypoint(
			{ module: this.moduleExtensions, registry: this.registryExtensions, local: this.localExtensions },
			this.extensionsSettings,
		);

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
		} catch (error) {
			logger.warn(`Couldn't bundle App extensions`);
			logger.warn(error);
		}

		return null;
	}

	private async registerSandboxedApiExtension(extension: ApiExtension | HybridExtension) {
		const logger = useLogger();

		const sandboxMemory = Number(env['EXTENSIONS_SANDBOX_MEMORY']);
		const sandboxTimeout = Number(env['EXTENSIONS_SANDBOX_TIMEOUT']);

		const entrypointPath = path.resolve(
			extension.path,
			isTypeIn(extension, HYBRID_EXTENSION_TYPES) ? extension.entrypoint.api : extension.entrypoint,
		);

		const extensionCode = await readFile(entrypointPath, 'utf-8');

		const isolate = new ivm.Isolate({
			memoryLimit: sandboxMemory,
			onCatastrophicError: (error) => {
				logger.error(`Error in API extension sandbox of ${extension.type} "${extension.name}"`);
				logger.error(error);

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
			this.endpointRouter,
		);

		await context.evalClosure(code, [cb, ...hostFunctions.map((fn) => new ivm.Reference(fn))], {
			timeout: sandboxTimeout,
			filename: '<extensions-sandbox>',
		});

		this.unregisterFunctionMap.set(extension.name, async () => {
			await unregisterFunction();

			if (!isolate.isDisposed) isolate.dispose();
		});
	}

	private async registerApiExtensions(): Promise<void> {
		const sources = {
			module: this.moduleExtensions,
			registry: this.registryExtensions,
			local: this.localExtensions,
		} as const;

		await Promise.all(
			Object.entries(sources).map(async ([source, extensions]) => {
				await Promise.all(
					Array.from(extensions.entries()).map(async ([folder, extension]) => {
						const { id, enabled } = this.extensionsSettings.find(
							(settings) => settings.source === source && settings.folder === folder,
						) ?? { enabled: false };

						if (!enabled) return;

						switch (extension.type) {
							case 'hook':
								await this.registerHookExtension(extension);
								break;
							case 'endpoint':
								await this.registerEndpointExtension(extension);
								break;
							case 'operation':
								await this.registerOperationExtension(extension);
								break;
							case 'bundle':
								await this.registerBundleExtension(extension, source as 'module' | 'registry' | 'local', id);
								break;
							default:
								return;
						}
					}),
				);
			}),
		);
	}

	private async registerHookExtension(hook: ApiExtension) {
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
		} catch (error) {
			this.handleExtensionError({ error, reason: `Couldn't register hook "${hook.name}"` });
		}
	}

	private async registerEndpointExtension(endpoint: ApiExtension) {
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
					},
				);

				const config = getModuleDefault(endpointInstance);

				const unregister = this.registerEndpoint(config, endpoint.name);

				this.unregisterFunctionMap.set(endpoint.name, async () => {
					await unregister();

					deleteFromRequireCache(endpointPath);
				});
			}
		} catch (error) {
			this.handleExtensionError({ error, reason: `Couldn't register endpoint "${endpoint.name}"` });
		}
	}

	private async registerOperationExtension(operation: HybridExtension) {
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
					},
				);

				const config = getModuleDefault(operationInstance);

				const unregister = this.registerOperation(config);

				this.unregisterFunctionMap.set(operation.name, async () => {
					await unregister();

					deleteFromRequireCache(operationPath);
				});
			}
		} catch (error) {
			this.handleExtensionError({ error, reason: `Couldn't register operation "${operation.name}"` });
		}
	}

	private async registerBundleExtension(
		bundle: BundleExtension,
		source: 'local' | 'registry' | 'module',
		bundleId: string,
	) {
		const extensionEnabled = (extensionName: string) => {
			const settings = this.extensionsSettings.find(
				(settings) => settings.source === source && settings.folder === extensionName && settings.bundle === bundleId,
			);

			if (!settings) return false;
			return settings.enabled;
		};

		try {
			const bundlePath = path.resolve(bundle.path, bundle.entrypoint.api);

			const bundleInstances: BundleConfig | { default: BundleConfig } = await importFileUrl(
				bundlePath,
				import.meta.url,
				{
					fresh: true,
				},
			);

			const configs = getModuleDefault(bundleInstances);

			const unregisterFunctions: PromiseCallback[] = [];

			for (const { config, name } of configs.hooks) {
				if (!extensionEnabled(name)) continue;

				const unregisters = this.registerHook(config, name);

				unregisterFunctions.push(...unregisters);
			}

			for (const { config, name } of configs.endpoints) {
				if (!extensionEnabled(name)) continue;

				const unregister = this.registerEndpoint(config, name);

				unregisterFunctions.push(unregister);
			}

			for (const { config, name } of configs.operations) {
				if (!extensionEnabled(name)) continue;

				const unregister = this.registerOperation(config);

				unregisterFunctions.push(unregister);
			}

			this.unregisterFunctionMap.set(bundle.name, async () => {
				await Promise.all(unregisterFunctions.map((fn) => fn()));

				deleteFromRequireCache(bundlePath);
			});
		} catch (error) {
			this.handleExtensionError({ error, reason: `Couldn't register bundle "${bundle.name}"` });
		}
	}

	/**
	 * Import the operation module code for all operation extensions, and register them individually through
	 * registerOperation
	 */
	private async registerInternalOperations(): Promise<void> {
		const internalOperations = await readdir(path.join(__dirname, '..', 'operations'));

		for (const operation of internalOperations) {
			const operationInstance: OperationApiConfig | { default: OperationApiConfig } = await import(
				`../operations/${operation}/index.js`
			);

			const config = getModuleDefault(operationInstance);

			this.registerOperation(config);
		}
	}

	/**
	 * Register a single hook
	 */
	private registerHook(hookRegistrationCallback: HookConfig, name: string): PromiseCallback[] {
		const logger = useLogger();

		let scheduleIndex = 0;

		const unregisterFunctions: PromiseCallback[] = [];

		const hookRegistrationContext = {
			filter: <T = unknown>(event: string, handler: FilterHandler<T>) => {
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
							} catch (error) {
								logger.error(error);
							}
						}
					});

					scheduleIndex++;

					unregisterFunctions.push(async () => {
						await job.stop();
					});
				} else {
					this.handleExtensionError({ reason: `Couldn't register cron hook. Provided cron is invalid: ${cron}` });
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
					this.handleExtensionError({ reason: `Couldn't register embed hook. Provided code is empty!` });
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
		const logger = useLogger();

		const endpointRegistrationCallback = typeof config === 'function' ? config : config.handler;
		const nameWithoutType = name.includes(':') ? name.split(':')[0] : name;
		const routeName = typeof config === 'function' ? nameWithoutType : config.id;

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

	/**
	 * If extensions must load successfully, any errors will cause the process to exit.
	 * Otherwise, the error will only be logged as a warning.
	 */
	private handleExtensionError({ error, reason }: { error?: unknown; reason: string }): void {
		const logger = useLogger();

		if (toBoolean(env['EXTENSIONS_MUST_LOAD'])) {
			logger.error('EXTENSION_MUST_LOAD is enabled and an extension failed to load.');
			logger.error(reason);
			if (error) logger.error(error);
			process.exit(1);
		} else {
			logger.warn(reason);
			if (error) logger.warn(error);
		}
	}
}
