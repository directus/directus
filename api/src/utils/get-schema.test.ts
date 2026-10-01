import type { SchemaOverview } from '@directus/types';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { getMemorySchemaCache, setMemorySchemaCache } from '../cache.js';
import { getSchema } from './get-schema.js';
import { runExclusive } from './run-exclusive.js';

vi.mock('@directus/env', async () => {
	const { mockEnv } = await import('../test-utils/env.js');

	return mockEnv({
		CACHE_SCHEMA: true,
		CACHE_SCHEMA_SYNC_TIMEOUT: 10000,
	});
});

vi.mock('./run-exclusive.js', () => ({ runExclusive: vi.fn() }));

vi.mock('../cache.js', () => ({
	getMemorySchemaCache: vi.fn(),
	setMemorySchemaCache: vi.fn(),
}));

vi.mock('../logger/index.js', () => ({
	useLogger: () => ({ trace: vi.fn(), warn: vi.fn() }),
}));

const SCHEMA = { collections: {}, relations: [] } as unknown as SchemaOverview;

afterEach(() => {
	vi.clearAllMocks();
});

describe('getSchema', () => {
	test('returns the cached schema without an exclusive run', async () => {
		vi.mocked(getMemorySchemaCache).mockReturnValueOnce(SCHEMA);

		await expect(getSchema()).resolves.toBe(SCHEMA);

		expect(runExclusive).not.toHaveBeenCalled();
		expect(setMemorySchemaCache).not.toHaveBeenCalled();
	});

	test('builds the schema in an exclusive run and caches it', async () => {
		vi.mocked(runExclusive).mockResolvedValue({ result: SCHEMA, leader: true });

		await expect(getSchema()).resolves.toBe(SCHEMA);

		expect(runExclusive).toHaveBeenCalledWith('schema-cache', expect.any(Function), { timeout: 10000 });
		expect(setMemorySchemaCache).toHaveBeenCalledWith(SCHEMA);
	});

	test('caches the schema received from another leader', async () => {
		vi.mocked(runExclusive).mockResolvedValue({ result: SCHEMA, leader: false });

		await expect(getSchema()).resolves.toBe(SCHEMA);

		expect(setMemorySchemaCache).toHaveBeenCalledWith(SCHEMA);
	});

	test('passes errors from the exclusive run through without retrying', async () => {
		vi.mocked(runExclusive).mockRejectedValue(new Error('connection refused'));

		await expect(getSchema()).rejects.toThrow('connection refused');

		expect(runExclusive).toHaveBeenCalledTimes(1);
		expect(setMemorySchemaCache).not.toHaveBeenCalled();
	});
});
