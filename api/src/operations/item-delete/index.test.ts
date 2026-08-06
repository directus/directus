import { InvalidPayloadError } from '@directus/errors';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { ItemsService } from '../../services/items.js';
import config from './index.js';

vi.mock('../../services/items.js', async () => {
	const { mockItemsService } = await import('../../test-utils/services/items-service.js');
	return mockItemsService();
});

vi.mock('../../utils/get-accountability-for-role.js', () => ({
	getAccountabilityForRole: vi.fn((role: string | null, _context) => Promise.resolve(role)),
}));

const testCollection = 'test';
const testQuery = { limit: -1 };
const testId = '00000000-0000-0000-0000-000000000000';
const testAccountability = { user: testId, role: testId };

const getSchema = vi.fn().mockResolvedValue({});

function run(options: Record<string, unknown>) {
	return config.handler(
		{ collection: testCollection, ...options } as any,
		{ accountability: testAccountability, getSchema } as any,
	);
}

describe('Operations / Item Delete', () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	test.each([
		{ permissions: undefined, expected: testAccountability },
		{ permissions: '$trigger', expected: testAccountability },
		{ permissions: '$full', expected: 'system' },
		{ permissions: '$public', expected: null },
		{ permissions: 'test', expected: 'test' },
	])('accountability for permissions "$permissions" should be $expected', async ({ permissions, expected }) => {
		await run({ query: testQuery, permissions });

		expect(vi.mocked(ItemsService)).toHaveBeenCalledWith(
			testCollection,
			expect.objectContaining({ schema: {}, accountability: expected, knex: undefined }),
		);
	});

	describe('input shape validation', () => {
		test.each([
			{ scenario: 'query is not an object', options: { query: 5 } },
			{ scenario: 'keys contains a non-primary-key value', options: { key: [{ id: 1 }] } },
		])('should throw when $scenario', async ({ options }) => {
			await expect(run(options)).rejects.toThrow(InvalidPayloadError);
			expect(ItemsService.prototype.deleteByQuery).not.toHaveBeenCalled();
			expect(ItemsService.prototype.deleteMany).not.toHaveBeenCalled();
		});
	});

	describe('cross-field validation', () => {
		test('should throw when neither keys nor query is provided', async () => {
			await expect(run({})).rejects.toThrow('Must provide "keys" or "query"');
			expect(ItemsService.prototype.deleteByQuery).not.toHaveBeenCalled();
			expect(ItemsService.prototype.deleteMany).not.toHaveBeenCalled();
		});

		test('should throw when keys is an empty array and no query is provided', async () => {
			await expect(run({ key: [] })).rejects.toThrow('"keys" cannot be empty');
			expect(ItemsService.prototype.deleteByQuery).not.toHaveBeenCalled();
			expect(ItemsService.prototype.deleteMany).not.toHaveBeenCalled();
		});

		test.each([
			{ key: [1], label: 'a single key' },
			{ key: [1, 2], label: 'multiple keys' },
		])('should throw when both $label and query are provided', async ({ key }) => {
			await expect(run({ key, query: testQuery })).rejects.toThrow('Cannot use both "keys" and "query"');
			expect(ItemsService.prototype.deleteByQuery).not.toHaveBeenCalled();
			expect(ItemsService.prototype.deleteMany).not.toHaveBeenCalled();
		});
	});

	describe('routing', () => {
		// Regression guard for the reported bug: empty keys must never fall through to deleteByQuery (delete-all)
		test.each([undefined, []])('should call deleteByQuery when query is set and key is %s', async (key) => {
			await run({ query: testQuery, key });

			expect(ItemsService.prototype.deleteByQuery).toHaveBeenCalledWith(testQuery, expect.anything());
			expect(ItemsService.prototype.deleteMany).not.toHaveBeenCalled();
		});

		test.each([
			{ key: 1, expected: [1] },
			{ key: [1], expected: [1] },
			{ key: [1, 2, 3], expected: [1, 2, 3] },
			{ key: '1,2', expected: ['1', '2'] },
		])('should call deleteMany with $expected when key is $key', async ({ key, expected }) => {
			await run({ key });

			expect(ItemsService.prototype.deleteMany).toHaveBeenCalledWith(expected, expect.anything());
			expect(ItemsService.prototype.deleteByQuery).not.toHaveBeenCalled();
		});
	});

	describe('return value', () => {
		test.each([1, [1]])('should return the scalar key for a single-key delete (key %s)', async (key) => {
			const result = await run({ key });
			expect(result).toBe(1);
		});

		test('should return the array of keys for a multi-key delete', async () => {
			vi.mocked(ItemsService.prototype.deleteMany).mockResolvedValueOnce([1, 2, 3]);

			const result = await run({ key: [1, 2, 3] });
			expect(result).toEqual([1, 2, 3]);
		});

		test('should return the deleteByQuery result array', async () => {
			vi.mocked(ItemsService.prototype.deleteByQuery).mockResolvedValueOnce([9, 8]);

			const result = await run({ query: testQuery });
			expect(result).toEqual([9, 8]);
		});
	});

	describe('emitEvents', () => {
		test.each([
			{ emitEvents: true, expected: true },
			{ emitEvents: false, expected: false },
			{ emitEvents: undefined, expected: false },
		])('should pass emitEvents=$expected to deleteByQuery when given $emitEvents', async ({ emitEvents, expected }) => {
			await run({ query: testQuery, emitEvents });
			expect(ItemsService.prototype.deleteByQuery).toHaveBeenCalledWith(testQuery, { emitEvents: expected });
		});

		test.each([
			{ emitEvents: true, expected: true },
			{ emitEvents: false, expected: false },
			{ emitEvents: undefined, expected: false },
		])('should pass emitEvents=$expected to deleteMany when given $emitEvents', async ({ emitEvents, expected }) => {
			await run({ key: [1, 2, 3], emitEvents });
			expect(ItemsService.prototype.deleteMany).toHaveBeenCalledWith([1, 2, 3], { emitEvents: expected });
		});
	});
});
