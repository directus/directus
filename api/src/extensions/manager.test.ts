import { processId } from '@directus/utils/node';
import { afterEach, beforeEach, describe, expect, type MockInstance, test, vi } from 'vitest';
import { useBus } from '../bus/index.js';
import emitter from '../emitter.js';
import { withResolvers } from '../test-utils/async.js';
import { createMockBus } from '../test-utils/bus.js';
import { ExtensionManager } from './manager.js';

const { syncExtensions, getExtensions, getExtensionsSettings, importFileUrl, scheduleSynchronizedJob, readdir } =
	vi.hoisted(() => ({
		syncExtensions: vi.fn(),
		getExtensions: vi.fn(),
		getExtensionsSettings: vi.fn(),
		importFileUrl: vi.fn(),
		scheduleSynchronizedJob: vi.fn(),
		readdir: vi.fn(),
	}));

vi.mock('@directus/env', async () => {
	const { mockUseEnv } = await import('../test-utils/env.js');
	return mockUseEnv({ EXTENSIONS_LOCATION: 'extensions', SERVE_APP: false, EXTENSIONS_AUTO_RELOAD: false });
});

vi.mock('../logger/index.js', async () => {
	const { createMockLogger } = await import('../test-utils/logger.js');
	return { useLogger: () => createMockLogger() };
});

vi.mock('../emitter.js', async () => {
	const { mockEmitter } = await import('../test-utils/emitter.js');

	return {
		...mockEmitter(),
		Emitter: vi.fn(function () {
			return { offAll: vi.fn() };
		}),
	};
});

vi.mock('../database/index.js', async () => {
	const { mockDatabase } = await import('../test-utils/database.js');
	return mockDatabase();
});

vi.mock('node:fs/promises', async (importOriginal) => ({
	...(await importOriginal<typeof import('node:fs/promises')>()),
	readdir,
}));

vi.mock('../bus/index.js');
vi.mock('../flows.js', () => ({ getFlowManager: vi.fn() }));
vi.mock('../services/index.js', () => ({}));
vi.mock('../utils/get-schema.js', () => ({ getSchema: vi.fn() }));
vi.mock('../utils/import-file-url.js', () => ({ importFileUrl }));
vi.mock('../utils/delete-from-require-cache.js', () => ({ deleteFromRequireCache: vi.fn() }));
vi.mock('../utils/schedule.js', () => ({ scheduleSynchronizedJob, validateCron: () => true }));
vi.mock('./lib/sync/sync.js', () => ({ syncExtensions }));
vi.mock('./lib/get-extensions.js', () => ({ getExtensions }));
vi.mock('./lib/get-extensions-settings.js', () => ({ getExtensionsSettings }));
vi.mock('./lib/installation/index.js', () => ({ getInstallationManager: vi.fn() }));
vi.mock('isolated-vm', () => ({ default: {} }));

function flushPromises() {
	return new Promise((resolve) => setImmediate(resolve));
}

function createExtensions(local: [string, unknown][] = []) {
	return { local: new Map(local), registry: new Map(), module: new Map() };
}

const HOOK = { type: 'hook', name: 'hook-a', path: '/extensions/hook-a', entrypoint: 'index.js', local: true };

describe('ExtensionManager', () => {
	let testBus: ReturnType<typeof createMockBus>;
	let exit: MockInstance;

	beforeEach(() => {
		syncExtensions.mockReset().mockResolvedValue(undefined);
		getExtensions.mockReset().mockResolvedValue(createExtensions());
		getExtensionsSettings.mockReset().mockResolvedValue([]);
		importFileUrl.mockReset();
		scheduleSynchronizedJob.mockReset();
		readdir.mockReset().mockResolvedValue([]);

		testBus = createMockBus();
		vi.mocked(useBus).mockReturnValue(testBus.bus as any);

		exit = vi.spyOn(process, 'exit').mockImplementation((() => undefined) as never);
	});

	afterEach(() => {
		exit.mockRestore();
		vi.clearAllMocks();
	});

	async function initialize() {
		const manager = new ExtensionManager();
		await manager.initialize({ watch: false });

		return manager;
	}

	/** Loads HOOK as an enabled extension, registering the given hook config */
	function mockHook(register: (context: any) => void) {
		getExtensionsSettings.mockResolvedValue([
			{ id: 'hook-a-id', source: 'local', folder: 'hook-a', enabled: true, bundle: null },
		]);

		importFileUrl.mockResolvedValue({ default: register });
	}

	describe('initialize', () => {
		test('should exit when syncing the extensions fails', async () => {
			syncExtensions.mockRejectedValueOnce(new Error('socket hang up'));

			await initialize();

			expect(exit).toHaveBeenCalledWith(1);
		});

		test('should skip initializing again when already initialized', async () => {
			const manager = await initialize();

			await manager.initialize({ watch: false });

			expect(getExtensions).toHaveBeenCalledTimes(1);
		});

		test('should subscribe to reload messages only once when initialized again', async () => {
			const subscribe = vi.spyOn(testBus.bus, 'subscribe');

			const manager = await initialize();

			await manager.initialize({ watch: false });

			expect(subscribe).toHaveBeenCalledTimes(1);
		});

		test('should queue a reload requested during the initial load', async () => {
			const initialSync = withResolvers<void>();
			syncExtensions.mockReturnValueOnce(initialSync.promise);

			const manager = new ExtensionManager();
			const initializing = manager.initialize({ watch: false });
			const reloading = manager.reload();

			initialSync.resolve();
			await initializing;
			await reloading;

			// The initial load and the reload
			expect(getExtensions).toHaveBeenCalledTimes(2);
		});

		test('should not leave a failed subscription to reload messages unhandled', async () => {
			// A plain function rather than a mock, as Vitest marks rejections returned by mocks as handled
			testBus.bus.subscribe = (() => Promise.reject(new Error('Connection is closed.'))) as any;

			await initialize();

			// Lets an unhandled rejection surface and fail the run, as it would crash the process
			await flushPromises();
		});
	});

	describe('reload', () => {
		test('should keep the loaded extensions when syncing fails', async () => {
			const extension = { type: 'interface', name: 'interface-a', path: '/extensions/interface-a', local: true };
			getExtensions.mockResolvedValueOnce(createExtensions([['interface-a', extension]]));

			const manager = await initialize();

			syncExtensions.mockRejectedValueOnce(new Error('socket hang up'));

			await expect(manager.reload()).resolves.toBeUndefined();

			expect(exit).not.toHaveBeenCalled();
			expect(emitter.emitAction).not.toHaveBeenCalledWith('extensions.unload', expect.anything());
			expect(manager.extensions).toEqual([extension]);
		});

		test('should resolve a skipped reload only once the queued reload is done', async () => {
			const manager = await initialize();

			const sync = withResolvers<void>();
			syncExtensions.mockReturnValueOnce(sync.promise);

			manager.reload();
			manager.reload();

			let reloaded = false;
			const skipped = manager.reload().then(() => (reloaded = true));

			await flushPromises();
			expect(reloaded).toBe(false);

			sync.resolve();
			await skipped;

			// The initial load and the two queued reloads
			expect(getExtensions).toHaveBeenCalledTimes(3);
		});

		test('should skip the reload when the extensions are not initialized yet', async () => {
			await expect(new ExtensionManager().reload()).resolves.toBeUndefined();

			expect(getExtensions).not.toHaveBeenCalled();
		});

		test('should reload again after loading the extensions failed', async () => {
			const manager = await initialize();

			readdir.mockRejectedValueOnce(new Error('EMFILE: too many open files'));
			await manager.reload();
			await manager.reload();

			// The initial load and both reloads
			expect(getExtensions).toHaveBeenCalledTimes(3);
		});

		test('should finish the reload when unregistering an extension fails', async () => {
			getExtensions.mockResolvedValue(createExtensions([['hook-a', HOOK]]));
			mockHook(({ schedule }) => schedule('* * * * *', vi.fn()));
			scheduleSynchronizedJob.mockReturnValue({ stop: vi.fn().mockRejectedValue(new Error('Connection is closed.')) });

			const manager = await initialize();
			await manager.reload();

			// Registered again by the load after unloading
			expect(importFileUrl).toHaveBeenCalledTimes(2);
		});

		test('should not unregister a removed extension again on later reloads', async () => {
			getExtensions.mockResolvedValueOnce(createExtensions([['hook-a', HOOK]]));
			mockHook(({ action }) => action('items.create', vi.fn()));

			const manager = await initialize();

			// The hook is gone from the extensions on both reloads
			await manager.reload();
			await manager.reload();

			expect(emitter.offAction).toHaveBeenCalledTimes(1);
		});
	});

	describe('isReloading', () => {
		test('should wait for a running reload', async () => {
			const manager = await initialize();

			const sync = withResolvers<void>();
			syncExtensions.mockReturnValueOnce(sync.promise);

			manager.reload();

			let reloaded = false;
			const waiting = manager.isReloading().then(() => (reloaded = true));

			await flushPromises();
			expect(reloaded).toBe(false);

			sync.resolve();
			await waiting;

			// The initial load and the reload
			expect(getExtensions).toHaveBeenCalledTimes(2);
		});

		test('should wait for reloads queued while waiting', async () => {
			const manager = await initialize();

			const first = withResolvers<void>();
			syncExtensions.mockReturnValueOnce(first.promise);

			manager.reload();
			const waiting = manager.isReloading();
			manager.reload();

			first.resolve();
			await waiting;

			// The initial load and both reloads, as the second starts before the waiting caller resumes
			expect(getExtensions).toHaveBeenCalledTimes(3);
		});
	});

	describe('reload messages', () => {
		test('should reload with the options of a message from another process', async () => {
			const manager = await initialize();

			await testBus.bus.publish('extensions.reload', { partialSync: '.registry/extension', origin: 'other-process' });
			await manager.isReloading();

			expect(syncExtensions).toHaveBeenLastCalledWith({ partialSync: '.registry/extension' });
		});

		test('should ignore messages published by the current process', async () => {
			const manager = await initialize();

			await testBus.bus.publish('extensions.reload', { origin: processId() });
			await manager.isReloading();

			expect(syncExtensions).toHaveBeenCalledTimes(1);
		});

		test('should ignore empty messages', async () => {
			const manager = await initialize();

			await testBus.bus.publish('extensions.reload', null);
			await manager.isReloading();

			expect(syncExtensions).toHaveBeenCalledTimes(1);
		});
	});
});
