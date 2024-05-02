import type { Cache } from '@directus/memory';
import type { Knex } from 'knex';
import { beforeEach, expect, test, vi } from 'vitest';
import { useCache } from '../../../cache.js';
import type { GlobalAccess } from '../types.js';
import { fetchGlobalAccessForQuery } from './fetch-global-access-for-query.js';

vi.mock('../../../cache.js');

let qb: Knex.QueryBuilder;
let cache: Cache;

beforeEach(() => {
	vi.clearAllMocks();

	qb = {
		select: vi.fn().mockReturnThis(),
		from: vi.fn().mockReturnThis(),
		leftJoin: vi.fn().mockResolvedValue([]),
	} as unknown as Knex.QueryBuilder;

	cache = {
		get: vi.fn(),
		set: vi.fn(),
	} as unknown as Cache;

	vi.mocked(useCache).mockReturnValue(cache);
});

test('Returns cached value if exists', async () => {
	const cached = {} as unknown as GlobalAccess;
	vi.mocked(cache.get).mockResolvedValue(cached);

	const res = await fetchGlobalAccessForQuery(qb, 'cache-key');

	expect(res).toBe(cached);
	expect(cache.get).toHaveBeenCalledWith('cache-key');
});

test('Returns false by default if no access is found', async () => {
	const res = await fetchGlobalAccessForQuery(qb, 'cache-key');

	expect(res).toEqual({
		app: false,
		admin: false,
	});
});

test('Sets app true if one or more access rows have app access set as true', async () => {
	vi.mocked(qb.leftJoin).mockResolvedValue([
		{ admin_access: false, app_access: false },
		{ admin_access: false, app_access: true },
		{ admin_access: false, app_access: false },
	]);

	const res = await fetchGlobalAccessForQuery(qb, 'cache-key');

	expect(res).toEqual({ admin: false, app: true });
});

test('Sets admin & app true if one or more access rows have app admin set as true', async () => {
	vi.mocked(qb.leftJoin).mockResolvedValue([
		{ admin_access: false, app_access: false },
		{ admin_access: true, app_access: false },
		{ admin_access: false, app_access: false },
	]);

	const res = await fetchGlobalAccessForQuery(qb, 'cache-key');

	expect(res).toEqual({ admin: true, app: true });
});

test('Sets app true if one or more access rows have app access set as 1', async () => {
	vi.mocked(qb.leftJoin).mockResolvedValue([
		{ admin_access: 0, app_access: 0 },
		{ admin_access: 0, app_access: 1 },
		{ admin_access: 0, app_access: 0 },
	]);

	const res = await fetchGlobalAccessForQuery(qb, 'cache-key');

	expect(res).toEqual({ admin: false, app: true });
});

test('Sets admin & app true if one or more access rows have app admin set as true', async () => {
	vi.mocked(qb.leftJoin).mockResolvedValue([
		{ admin_access: 0, app_access: 0 },
		{ admin_access: 1, app_access: 0 },
		{ admin_access: 0, app_access: 0 },
	]);

	const res = await fetchGlobalAccessForQuery(qb, 'cache-key');

	expect(res).toEqual({ admin: true, app: true });
});

test('Saves output to cache under given cache key', async () => {
	vi.mocked(qb.leftJoin).mockResolvedValue([{ admin_access: false, app_access: true }]);

	await fetchGlobalAccessForQuery(qb, 'cache-key');

	expect(cache.set).toHaveBeenCalledWith('cache-key', { admin: false, app: true });
});
