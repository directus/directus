import type { SchemaOverview } from '@directus/types';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const bus = vi.hoisted(() => ({
	publish: vi.fn(),
	subscribe: vi.fn(),
	unsubscribe: vi.fn(),
}));

const lock = vi.hoisted(() => ({
	increment: vi.fn(),
	delete: vi.fn(),
}));

vi.mock('@directus/env', async () => {
	const { mockEnv } = await import('../test-utils/env.js');

	return mockEnv({
		CACHE_SCHEMA: true,
		CACHE_SCHEMA_MAX_ITERATIONS: 100,
		CACHE_SCHEMA_SYNC_TIMEOUT: 10000,
	});
});

vi.mock('../bus/index.js', () => ({ useBus: () => bus }));

vi.mock('../lock/index.js', () => ({ useLock: () => lock }));

vi.mock('../cache.js', () => ({
	getMemorySchemaCache: vi.fn(),
	setMemorySchemaCache: vi.fn(),
}));

vi.mock('../logger/index.js', () => ({
	useLogger: () => ({ trace: vi.fn(), warn: vi.fn() }),
}));

const { getSchema } = await import('./get-schema.js');

const SCHEMA = { collections: {}, relations: [] } as unknown as SchemaOverview;

beforeEach(() => {
	vi.useFakeTimers();
	vi.clearAllMocks();
	lock.increment.mockResolvedValue(2);
	bus.subscribe.mockResolvedValue(undefined);
	bus.unsubscribe.mockResolvedValue(undefined);
});

afterEach(() => {
	vi.useRealTimers();
});

test('unsubscribes from the schema cache bus when waiting times out', async () => {
	const assertion = expect(getSchema()).rejects.toThrow('hit infinite loop');

	await vi.advanceTimersByTimeAsync(30000);
	await assertion;

	expect(bus.subscribe).toHaveBeenCalledTimes(3);
	expect(bus.unsubscribe).toHaveBeenCalledTimes(3);
});

test('clears the timeout when the schema cache bus responds', async () => {
	bus.subscribe.mockImplementation(async (_channel: string, handler: (options: { schema: SchemaOverview }) => void) =>
		handler({ schema: SCHEMA }),
	);

	await expect(getSchema()).resolves.toBe(SCHEMA);

	expect(bus.unsubscribe).toHaveBeenCalledTimes(1);
	expect(vi.getTimerCount()).toBe(0);
});
