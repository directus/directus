import { type Knex } from 'knex';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { getExtensionCount } from './get-extension-count.js';

let mockResult: { count: string }[];
let mockBundleResult: { count: string }[];
let mockFilteredBundleResult: { count: string }[];
let mockDb: Knex;

beforeEach(() => {
	mockResult = [
		{
			count: '15',
		},
	];

	mockBundleResult = [
		{
			count: '3',
		},
	];

	mockFilteredBundleResult = [
		{
			count: '2',
		},
	];

	mockDb = {
		count: vi.fn().mockReturnThis(),
		distinct: vi.fn().mockReturnThis(),
		from: vi.fn().mockReturnThis(),
		where: vi.fn().mockResolvedValue(mockResult),
		whereIn: vi.fn().mockReturnThis(),
		andWhere: vi.fn().mockResolvedValue(mockFilteredBundleResult),
	} as unknown as Knex;
});

afterEach(() => {
	vi.clearAllMocks();
});

test('Fetches extension count from the database', async () => {
	vi.mocked(mockDb.where).mockResolvedValueOnce(mockResult);
	vi.mocked(mockDb.where).mockResolvedValueOnce(mockBundleResult);
	const result = await getExtensionCount(mockDb);

	expect(mockDb.count).toHaveBeenCalledWith('*', { as: 'count' });
	expect(mockDb.from).toHaveBeenCalledWith('directus_extensions');
	expect(mockDb.where).toHaveBeenCalledWith('enabled', '=', true);
	expect(mockDb.distinct).toHaveBeenCalledWith('bundle');
	expect(mockDb.whereIn).toHaveBeenCalledWith('id', mockBundleResult);
	expect(mockDb.andWhere).toHaveBeenCalledWith('enabled', '=', true);

	expect(mockDb.count).toBeCalledTimes(2);
	expect(mockDb.from).toBeCalledTimes(3);
	expect(mockDb.where).toBeCalledTimes(2);
	expect(mockDb.distinct).toBeCalledTimes(1);
	expect(mockDb.whereIn).toBeCalledTimes(1);
	expect(mockDb.andWhere).toBeCalledTimes(1);

	expect(result).toEqual({ activeTotal: 15, activeBundles: 2 });
});
