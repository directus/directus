import type { Knex } from 'knex';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { getFieldCount } from './get-field-count.js';

let mockResult: { max: number | null; total: number | null };
let mockDb: Knex;

beforeEach(() => {
	mockResult = { max: 5, total: 10 };

	mockDb = {
		max: vi.fn().mockReturnThis(),
		sum: vi.fn().mockReturnThis(),
		from: vi.fn().mockReturnThis(),
		select: vi.fn().mockReturnThis(),
		count: vi.fn().mockReturnThis(),
		groupBy: vi.fn().mockReturnThis(),
		as: vi.fn().mockReturnThis(),
		first: vi.fn().mockResolvedValue(mockResult),
	} as unknown as Knex;
});

afterEach(() => {
	vi.clearAllMocks();
});

describe('getFieldCount', () => {
	test('Gets field count through passed knex instance', async () => {
		const res = await getFieldCount(mockDb);

		expect(mockDb.max).toHaveBeenCalledWith({ max: 'field_count' });
		expect(mockDb.sum).toHaveBeenCalledWith({ total: 'field_count' });
		expect(mockDb.from).toHaveBeenCalledWith('directus_fields');
		expect(mockDb.select).toHaveBeenCalledWith('collection');
		expect(mockDb.count).toHaveBeenCalledWith('* as field_count');
		expect(mockDb.from).toHaveBeenCalledWith(mockDb);
		expect(mockDb.groupBy).toHaveBeenCalledWith('collection');
		expect(mockDb.as).toHaveBeenCalledWith('inner');
		expect(mockDb.first).toHaveBeenCalled();

		expect(res).toEqual({ max: 5, total: 10 });
	});

	test('Defaults count to 0 if database did not return it', async () => {
		mockResult.max = null;
		mockResult.total = null;

		const res = await getFieldCount(mockDb);

		expect(res).toEqual({ max: 0, total: 0 });
	});

	test('Defaults count to 0 if database did not return anything', async () => {
		vi.mocked(mockDb.first).mockResolvedValue(undefined);

		const res = await getFieldCount(mockDb);

		expect(res).toEqual({ max: 0, total: 0 });
	});
});
