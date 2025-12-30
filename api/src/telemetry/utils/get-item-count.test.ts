import { countCollection, getItemCount, mergeResults } from './get-item-count.js';
import type { Knex } from 'knex';
import pLimit, { type LimitFunction } from 'p-limit';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('p-limit');

let mockResult: { count: number | null };
let mockDb: Knex;
let mockLimitFn: LimitFunction;

beforeEach(() => {
	mockResult = { count: 15 };

	mockDb = {
		count: vi.fn().mockReturnThis(),
		from: vi.fn().mockReturnThis(),
		first: vi.fn().mockResolvedValue(mockResult),
	} as unknown as Knex;

	mockLimitFn = vi.fn().mockImplementation((_cb, _db, collection) => ({
		collection: collection.collection,
		count: 15,
	})) as unknown as LimitFunction;

	vi.mocked(pLimit).mockReturnValue(mockLimitFn);
});

afterEach(() => {
	vi.clearAllMocks();
});

describe('countCollection', () => {
	test('Gets row count through passed knex instance', async () => {
		const collection = 'test-collection';

		const res = await countCollection(mockDb, { collection });

		expect(mockDb.count).toHaveBeenCalledWith('*', { as: 'count' });
		expect(mockDb.from).toHaveBeenCalledWith(collection);
		expect(mockDb.first).toHaveBeenCalled();

		expect(res).toEqual({ collection, count: mockResult.count });
	});

	test('Defaults count to 0 if database did not return it', async () => {
		mockResult.count = null;

		const collection = 'test-collection';

		const res = await countCollection(mockDb, { collection });

		expect(res).toEqual({ collection, count: 0 });
	});

	test('Defaults count to 0 if database did not return anything', async () => {
		vi.mocked(mockDb.first).mockResolvedValue(undefined);

		const collection = 'test-collection';

		const res = await countCollection(mockDb, { collection });

		expect(res).toEqual({ collection, count: 0 });
	});
});

describe('mergeResults', () => {
	test('Sets collection as acc property with count and returns acc', () => {
		const acc = mergeResults({}, { collection: 'test', count: 15 });
		expect(acc).toEqual({ test: 15 });
	});
});

describe('getItemCount', () => {
	test('Limits to 3 simultaneous queries', async () => {
		await getItemCount(mockDb, [{ collection: 'test-a' }, { collection: 'test-b' }, { collection: 'test-c' }]);
		expect(pLimit).toHaveBeenCalledWith(3);
	});

	test('Calls limit with the count callback for each passed collection', async () => {
		await getItemCount(mockDb, [{ collection: 'test-a' }, { collection: 'test-b' }, { collection: 'test-c' }]);

		expect(mockLimitFn).toHaveBeenCalledTimes(3);
		expect(mockLimitFn).toHaveBeenCalledWith(countCollection, mockDb, { collection: 'test-a' });
		expect(mockLimitFn).toHaveBeenCalledWith(countCollection, mockDb, { collection: 'test-b' });
		expect(mockLimitFn).toHaveBeenCalledWith(countCollection, mockDb, { collection: 'test-c' });
	});

	test('Returns reduced result set', async () => {
		const res = await getItemCount(mockDb, [
			{ collection: 'test-a' },
			{ collection: 'test-b' },
			{ collection: 'test-c' },
		]);

		expect(res).toEqual({
			'test-a': 15,
			'test-b': 15,
			'test-c': 15,
		});
	});
});
