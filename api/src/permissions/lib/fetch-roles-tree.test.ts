import { beforeEach, test, expect, vi } from 'vitest';
import { fetchRolesTree } from './fetch-roles-tree.js';
import type { Knex } from 'knex';
import { useCache } from '../cache.js';

vi.mock('../cache.js');

let knex: Knex;

beforeEach(() => {
	knex = {
		select: vi.fn().mockReturnThis(),
		from: vi.fn().mockReturnThis(),
		where: vi.fn().mockReturnThis(),
		first: vi.fn().mockReturnThis(),
	} as unknown as Knex;

	vi.clearAllMocks();
});

test('', () => {

});
