import type { SchemaOverview } from '@directus/types';
import { beforeEach, describe, expect, test, vi } from 'vitest';

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

vi.mock('./redis/index.js', () => ({ redisConfigAvailable: () => true }));

vi.mock('./permissions/cache.js', () => ({ clearCache: vi.fn() }));

vi.mock('./logger/index.js', () => ({
	useLogger: () => ({ warn: vi.fn(), info: vi.fn(), error: vi.fn() }),
}));

const { clearSystemCache, getCache, setMemorySchemaCache, getMemorySchemaCache } = await import('./cache.js');

const SCHEMA = { collections: {}, relations: [] } as unknown as SchemaOverview;

describe('permission writes do not purge the schema cache', () => {
	beforeEach(async () => {
		vi.clearAllMocks();
		await getCache().lockCache.delete('system-cache-lock');
	});

	test('clearSystemCache keeps the schema cached when autoPurgeSchema is false', async () => {
		setMemorySchemaCache(SCHEMA);

		await clearSystemCache({ autoPurgeSchema: false });

		expect(getMemorySchemaCache()).toBeDefined();
	});

	test('clearSystemCache purges the schema cache on a full (default) clear', async () => {
		setMemorySchemaCache(SCHEMA);

		await clearSystemCache();

		expect(getMemorySchemaCache()).toBeUndefined();
	});

	test('the autoPurgeSchema flag is propagated to peers', async () => {
		await clearSystemCache({ autoPurgeSchema: false });

		expect(bus.publish).toHaveBeenCalledWith('schemaChanged', expect.objectContaining({ autoPurgeSchema: false }));
	});

	test('a peer keeps the schema cached when autoPurgeSchema is false', async () => {
		setMemorySchemaCache(SCHEMA);

		await bus.handlers.get('schemaChanged')!({ autoPurgeSchema: false });

		expect(getMemorySchemaCache()).toBeDefined();
	});

	test('a peer purges the schema cache on a structural change', async () => {
		setMemorySchemaCache(SCHEMA);

		await bus.handlers.get('schemaChanged')!({});

		expect(getMemorySchemaCache()).toBeUndefined();
	});
});
