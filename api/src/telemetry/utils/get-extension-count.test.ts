import { type Knex } from 'knex';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { getExtensionCount } from './get-extension-count.js';

let mockResult: { count: string; countBundles: string }[];
let mockDb: Knex;

beforeEach(() => {
	mockResult = [
		{
			count: '15',
			countBundles: '3',
		},
	];

	mockDb = {
		count: vi.fn().mockReturnThis(),
		countDistinct: vi.fn().mockReturnThis(),
		select: vi.fn().mockReturnThis(),
		from: vi.fn().mockReturnThis(),
		where: vi.fn().mockResolvedValue(mockResult),
	} as unknown as Knex;
});

afterEach(() => {
	vi.clearAllMocks();
});

test('Fetches extension count from the database', async () => {
	const result = await getExtensionCount(mockDb);

	expect(mockDb.count).toHaveBeenCalledWith('*', { as: 'count' });
	expect(mockDb.countDistinct).toHaveBeenCalledWith('bundle', { as: 'countBundles' });
	expect(mockDb.from).toHaveBeenCalledWith('directus_extensions');
	expect(mockDb.where).toHaveBeenCalledWith('enabled', '=', true);

	expect(result).toEqual({ total: 15, bundles: 3 });
});
