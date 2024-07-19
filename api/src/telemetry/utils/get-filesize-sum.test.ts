import type { Knex } from 'knex';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { getFilesizeSum } from './get-filesize-sum.js';

let mockResult: { total: number | null };
let mockDb: Knex;

beforeEach(() => {
	mockResult = { total: 10 };

	mockDb = {
		sum: vi.fn().mockReturnThis(),
		from: vi.fn().mockReturnThis(),
		first: vi.fn().mockResolvedValue(mockResult),
	} as unknown as Knex;
});

afterEach(() => {
	vi.clearAllMocks();
});

describe('getFilesizeSum', () => {
	test('Gets filesize sum through passed knex instance', async () => {
		const res = await getFilesizeSum(mockDb);

		expect(mockDb.sum).toHaveBeenCalledWith({ total: 'filesize' });
		expect(mockDb.from).toHaveBeenCalledWith('directus_files');
		expect(mockDb.first).toHaveBeenCalled();

		expect(res).toEqual({ total: 10 });
	});

	test('Defaults sum to 0 if database did not return it', async () => {
		mockResult.total = null;

		const res = await getFilesizeSum(mockDb);

		expect(res).toEqual({ total: 0 });
	});

	test('Defaults sum to 0 if database did not return anything', async () => {
		vi.mocked(mockDb.first).mockResolvedValue(undefined);

		const res = await getFilesizeSum(mockDb);

		expect(res).toEqual({ total: 0 });
	});
});
