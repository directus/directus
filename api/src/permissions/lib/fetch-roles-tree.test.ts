import type { Knex } from 'knex';
import { beforeEach, expect, test, vi } from 'vitest';
import { _fetchRolesTree } from './fetch-roles-tree.js';

let knex: Knex;

beforeEach(() => {
	knex = {
		select: vi.fn().mockReturnThis(),
		from: vi.fn().mockReturnThis(),
		where: vi.fn().mockReturnThis(),
		first: vi.fn(),
	} as unknown as Knex;

	vi.clearAllMocks();
});

test('Returns empty array if start value is null', async () => {
	const roles = await _fetchRolesTree(null, knex);
	expect(roles).toEqual([]);
});

test('Returns array of all parents in top-down order', async () => {
	vi.mocked(knex.first).mockResolvedValueOnce({ id: 'start', parent: 'second' });
	vi.mocked(knex.first).mockResolvedValueOnce({ id: 'second', parent: 'third' });
	vi.mocked(knex.first).mockResolvedValueOnce({ id: 'third', parent: null });
	vi.mocked(knex.first).mockResolvedValueOnce({ id: 'unrelated', parent: null });

	const roles = await _fetchRolesTree('start', knex);

	expect(roles).toEqual(['third', 'second', 'start']);
});
