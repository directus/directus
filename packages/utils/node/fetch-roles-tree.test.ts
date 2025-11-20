import type { Knex } from 'knex';
import { beforeEach, expect, test, vi } from 'vitest';
import { fetchRolesTree } from './fetch-roles-tree.js';

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
	const roles = await fetchRolesTree(null, { knex });
	expect(roles).toEqual([]);
});

test('Returns array of all parents in top-down order', async () => {
	vi.mocked(knex.first).mockResolvedValueOnce({ id: 'start', parent: 'second' });
	vi.mocked(knex.first).mockResolvedValueOnce({ id: 'second', parent: 'third' });
	vi.mocked(knex.first).mockResolvedValueOnce({ id: 'third', parent: null });
	vi.mocked(knex.first).mockResolvedValueOnce({ id: 'unrelated', parent: null });

	const roles = await fetchRolesTree('start', { knex });

	expect(roles).toEqual(['third', 'second', 'start']);
});

test('Exits if parent row is undefined', async () => {
	vi.mocked(knex.first).mockResolvedValueOnce({ id: 'start', parent: 'second' });
	vi.mocked(knex.first).mockResolvedValueOnce({ id: 'second', parent: 'third' });
	vi.mocked(knex.first).mockResolvedValueOnce(undefined);
	vi.mocked(knex.first).mockResolvedValueOnce({ id: 'unrelated', parent: null });

	const roles = await fetchRolesTree('start', { knex });

	expect(roles).toEqual(['second', 'start']);
});

test('Throws error if infinite recursion occurs', async () => {
	vi.mocked(knex.first).mockResolvedValueOnce({ id: 'first', parent: 'second' });
	vi.mocked(knex.first).mockResolvedValueOnce({ id: 'second', parent: 'third' });
	vi.mocked(knex.first).mockResolvedValueOnce({ id: 'third', parent: 'first' });

	await expect(fetchRolesTree('first', { knex })).rejects.toMatchInlineSnapshot(
		`[Error: Recursion encountered: role "third" already exists in tree path "third"->"second"->"first"]`,
	);
});
