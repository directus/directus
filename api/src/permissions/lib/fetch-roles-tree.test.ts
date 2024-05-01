import type { Cache } from '@directus/memory';
import type { Knex } from 'knex';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { useCache } from '../cache.js';
import { fetchRolesTree, getRolesCacheKey } from './fetch-roles-tree.js';

vi.mock('../cache.js');

let knex: Knex;
let cache: Cache;

beforeEach(() => {
	knex = {
		select: vi.fn().mockReturnThis(),
		from: vi.fn().mockReturnThis(),
		where: vi.fn().mockReturnThis(),
		first: vi.fn(),
	} as unknown as Knex;

	cache = {
		get: vi.fn(),
		set: vi.fn(),
	} as unknown as Cache;

	vi.mocked(useCache).mockReturnValue(cache);

	vi.clearAllMocks();
});

test('Returns empty array if start value is null', async () => {
	const roles = await fetchRolesTree(knex, null);
	expect(roles).toEqual([]);
});

test('Returns cached value if exists', async () => {
	const cachedRoles = ['cached-value'];
	vi.mocked(cache.get).mockResolvedValue(cachedRoles);

	const roles = await fetchRolesTree(knex, 'start');

	expect(cache.get).toHaveBeenCalledWith(`roles-tree-start`);
	expect(roles).toBe(cachedRoles);
});

test('Returns array of all parents in top-down order', async () => {
	vi.mocked(knex.first).mockResolvedValueOnce({ id: 'start', parent: 'second' });
	vi.mocked(knex.first).mockResolvedValueOnce({ id: 'second', parent: 'third' });
	vi.mocked(knex.first).mockResolvedValueOnce({ id: 'third', parent: null });
	vi.mocked(knex.first).mockResolvedValueOnce({ id: 'unrelated', parent: null });

	const roles = await fetchRolesTree(knex, 'start');

	expect(roles).toEqual(['third', 'second', 'start']);
});

test('Saves fetched roles to cache', async () => {
	vi.mocked(knex.first).mockResolvedValueOnce({ id: 'start', parent: 'second' });
	vi.mocked(knex.first).mockResolvedValueOnce({ id: 'second', parent: null });

	await fetchRolesTree(knex, 'start');

	expect(cache.set).toHaveBeenCalledWith('roles-tree-start', ['second', 'start']);
});

describe('getRolesCacheKey', () => {
	test('Returns start point prefixed with roles tree', () => {
		expect(getRolesCacheKey('test')).toBe('roles-tree-test');
	});
});
