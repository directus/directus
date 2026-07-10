import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const bus = vi.hoisted(() => {
	const handlers = new Map<string, (opts: any) => Promise<void> | void>();

	return {
		handlers,
		publish: vi.fn(),
		subscribe: vi.fn((event: string, handler: (opts: any) => Promise<void> | void) => {
			handlers.set(event, handler);
		}),
	};
});

vi.mock('@directus/env', async () => {
	const { mockEnv } = await import('./test-utils/env.js');

	return mockEnv({
		CACHE_ENABLED: true,
		CACHE_STORE: 'memory',
		CACHE_AUTO_PURGE: true,
		CACHE_NAMESPACE: 'directus-test',
		CACHE_TTL: '10m',
		CACHE_SYSTEM_TTL: '10m',
	});
});

vi.mock('./bus/index.js', () => ({
	useBus: () => ({ publish: bus.publish, subscribe: bus.subscribe }),
}));

// Force the module-load subscription block so the `permissionsChanged` peer handler is registered.
vi.mock('./redis/index.js', () => ({ redisConfigAvailable: () => true }));

vi.mock('./permissions/cache.js', () => ({ clearCache: vi.fn() }));

vi.mock('./logger/index.js', () => ({
	useLogger: () => ({ warn: vi.fn(), info: vi.fn(), error: vi.fn() }),
}));

const { clearPermissionRelatedCache, getCache } = await import('./cache.js');
const { clearCache: clearPermissionCache } = await import('./permissions/cache.js');

describe('clearPermissionRelatedCache', () => {
	beforeEach(async () => {
		vi.clearAllMocks();
		// Ensure no stale system-cache-lock between tests.
		await getCache().lockCache.delete('system-cache-lock');
	});

	test('clears system + permission caches and broadcasts permissionsChanged (not schemaChanged)', async () => {
		const systemClear = vi.spyOn(getCache().systemCache, 'clear');

		await clearPermissionRelatedCache();

		expect(systemClear).toHaveBeenCalledOnce();
		expect(clearPermissionCache).toHaveBeenCalledOnce();
		expect(bus.publish).toHaveBeenCalledWith('permissionsChanged', { autoPurgeCache: undefined });
		expect(bus.publish).not.toHaveBeenCalledWith('schemaChanged', expect.anything());
	});

	test('skips the system cache flush when the lock is held (and not forced)', async () => {
		await getCache().lockCache.set('system-cache-lock', true, 10000);
		const systemClear = vi.spyOn(getCache().systemCache, 'clear');

		await clearPermissionRelatedCache();

		expect(systemClear).not.toHaveBeenCalled();
		// permission cache + peer broadcast still happen regardless of the lock
		expect(clearPermissionCache).toHaveBeenCalledOnce();
		expect(bus.publish).toHaveBeenCalledWith('permissionsChanged', { autoPurgeCache: undefined });
	});

	test('forces the system cache flush even when the lock is held', async () => {
		await getCache().lockCache.set('system-cache-lock', true, 10000);
		const systemClear = vi.spyOn(getCache().systemCache, 'clear');

		await clearPermissionRelatedCache({ forced: true });

		expect(systemClear).toHaveBeenCalledOnce();
	});

	test('propagates autoPurgeCache: false to the broadcast', async () => {
		await clearPermissionRelatedCache({ autoPurgeCache: false });

		expect(bus.publish).toHaveBeenCalledWith('permissionsChanged', { autoPurgeCache: false });
	});
});

describe('permissionsChanged peer subscriber', () => {
	afterEach(() => vi.clearAllMocks());

	test('subscribes to permissionsChanged at module load', () => {
		expect(bus.handlers.has('permissionsChanged')).toBe(true);
	});

	test('clears the data cache and permission cache on memory store with auto-purge', async () => {
		const dataClear = vi.spyOn(getCache().cache!, 'clear');

		await bus.handlers.get('permissionsChanged')!(undefined);

		expect(dataClear).toHaveBeenCalledOnce();
		expect(clearPermissionCache).toHaveBeenCalledOnce();
	});

	test('leaves the data cache alone when autoPurgeCache is false', async () => {
		const dataClear = vi.spyOn(getCache().cache!, 'clear');

		await bus.handlers.get('permissionsChanged')!({ autoPurgeCache: false });

		expect(dataClear).not.toHaveBeenCalled();
		// permission cache is always cleared
		expect(clearPermissionCache).toHaveBeenCalledOnce();
	});
});
