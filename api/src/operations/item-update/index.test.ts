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
const testPayload = { foo: 'bar' };
const testId = '00000000-0000-0000-0000-000000000000';
const testAccountability = { user: testId, role: testId };

const getSchema = vi.fn().mockResolvedValue({});

function run(options: Record<string, unknown>) {
	return config.handler(
		{ collection: testCollection, ...options } as any,
		{ accountability: testAccountability, getSchema } as any,
	);
}

describe('Operations / Item Update', () => {
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
		await run({ payload: testPayload, permissions });

		expect(vi.mocked(ItemsService)).toHaveBeenCalledWith(
			testCollection,
			expect.objectContaining({ schema: {}, accountability: expected, knex: undefined }),
		);
	});

	describe('input shape validation', () => {
		test.each([
			{ scenario: 'query is not an object', options: { payload: testPayload, query: 5 } },
			{ scenario: 'payload is not an object or array', options: { payload: 5 } },
			{ scenario: 'keys contains a non-primary-key value', options: { payload: testPayload, key: [{ id: 1 }] } },
		])('should throw when $scenario', async ({ options }) => {
			await expect(run(options)).rejects.toThrow(InvalidPayloadError);
			expect(ItemsService.prototype.updateByQuery).not.toHaveBeenCalled();
			expect(ItemsService.prototype.updateMany).not.toHaveBeenCalled();
			expect(ItemsService.prototype.updateBatch).not.toHaveBeenCalled();
		});
	});

	describe('cross-field validation', () => {
		test.each([
			{ key: [1], label: 'a single key' },
			{ key: [1, 2], label: 'multiple keys' },
		])('should throw when both $label and query are provided', async ({ key }) => {
			await expect(run({ payload: testPayload, key, query: { limit: -1 } })).rejects.toThrow(
				'Cannot use both "keys" and "query"',
			);

			expect(ItemsService.prototype.updateByQuery).not.toHaveBeenCalled();
			expect(ItemsService.prototype.updateMany).not.toHaveBeenCalled();
		});
	});

	describe('routing', () => {
		// Without a payload there is nothing to update, so the operation is a no-op returning null
		test.each([
			{ scenario: 'a key but no payload', options: { key: 1 } },
			{ scenario: 'nothing at all', options: {} },
			{ scenario: 'only an empty keys array', options: { key: [] } },
			{ scenario: 'a query but no payload', options: { query: { limit: -1 } } },
		])('should return null and call nothing when given $scenario', async ({ options }) => {
			const result = await run(options);

			expect(result).toBe(null);
			expect(ItemsService.prototype.updateByQuery).not.toHaveBeenCalled();
			expect(ItemsService.prototype.updateMany).not.toHaveBeenCalled();
			expect(ItemsService.prototype.updateBatch).not.toHaveBeenCalled();
		});

		test('should call updateBatch when payload is an array', async () => {
			const batchPayload = [
				{ id: 1, foo: 'a' },
				{ id: 2, foo: 'b' },
			];

			await run({ payload: batchPayload });

			expect(ItemsService.prototype.updateBatch).toHaveBeenCalledWith(batchPayload, expect.anything());
			expect(ItemsService.prototype.updateByQuery).not.toHaveBeenCalled();
			expect(ItemsService.prototype.updateMany).not.toHaveBeenCalled();
		});

		test.each([undefined, []])('should call updateByQuery when query is set and key is %s', async (key) => {
			const query = { limit: -1 };

			await run({ payload: testPayload, query, key });

			expect(ItemsService.prototype.updateByQuery).toHaveBeenCalledWith(query, testPayload, expect.anything());
			expect(ItemsService.prototype.updateMany).not.toHaveBeenCalled();
			expect(ItemsService.prototype.updateBatch).not.toHaveBeenCalled();
		});

		test.each([
			{ key: 1, expected: [1] },
			{ key: [1], expected: [1] },
			{ key: [1, 2, 3], expected: [1, 2, 3] },
			{ key: '1,2', expected: ['1', '2'] },
		])('should call updateMany with $expected when key is $key', async ({ key, expected }) => {
			await run({ payload: testPayload, key });

			expect(ItemsService.prototype.updateMany).toHaveBeenCalledWith(expected, testPayload, expect.anything());
			expect(ItemsService.prototype.updateByQuery).not.toHaveBeenCalled();
			expect(ItemsService.prototype.updateBatch).not.toHaveBeenCalled();
		});

		// Regression guard for the reported bug: empty keys must never fall through to updateByQuery (update-all)
		test.each([
			{ scenario: 'empty keys with payload, no query', options: { payload: testPayload, key: [] } },
			{ scenario: 'payload only, no keys, no query', options: { payload: testPayload } },
			{
				scenario: 'empty keys, payload and null query (reported case)',
				options: { payload: testPayload, key: [], query: null },
			},
		])('should be a no-op updateMany([]) for $scenario', async ({ options }) => {
			await run(options);

			expect(ItemsService.prototype.updateMany).toHaveBeenCalledWith([], testPayload, expect.anything());
			expect(ItemsService.prototype.updateByQuery).not.toHaveBeenCalled();
			expect(ItemsService.prototype.updateBatch).not.toHaveBeenCalled();
		});
	});

	describe('return value', () => {
		test.each([1, [1]])('should return the scalar key for a single-key update (key %s)', async (key) => {
			const result = await run({ payload: testPayload, key });
			expect(result).toBe(1);
		});

		test('should return the array of keys for a multi-key update', async () => {
			vi.mocked(ItemsService.prototype.updateMany).mockResolvedValueOnce([1, 2, 3]);

			const result = await run({ payload: testPayload, key: [1, 2, 3] });
			expect(result).toEqual([1, 2, 3]);
		});

		test('should return the updateByQuery result array', async () => {
			vi.mocked(ItemsService.prototype.updateByQuery).mockResolvedValueOnce([9, 8]);

			const result = await run({ payload: testPayload, query: { limit: -1 } });
			expect(result).toEqual([9, 8]);
		});
	});

	describe('emitEvents', () => {
		test.each([
			{ emitEvents: true, expected: true },
			{ emitEvents: false, expected: false },
			{ emitEvents: undefined, expected: false },
		])('should pass emitEvents=$expected to updateByQuery when given $emitEvents', async ({ emitEvents, expected }) => {
			await run({ payload: testPayload, query: { limit: -1 }, emitEvents });

			expect(ItemsService.prototype.updateByQuery).toHaveBeenCalledWith({ limit: -1 }, testPayload, {
				emitEvents: expected,
			});
		});

		test.each([
			{ emitEvents: true, expected: true },
			{ emitEvents: false, expected: false },
			{ emitEvents: undefined, expected: false },
		])('should pass emitEvents=$expected to updateMany when given $emitEvents', async ({ emitEvents, expected }) => {
			await run({ payload: testPayload, key: [1, 2, 3], emitEvents });
			expect(ItemsService.prototype.updateMany).toHaveBeenCalledWith([1, 2, 3], testPayload, { emitEvents: expected });
		});

		test.each([
			{ emitEvents: true, expected: true },
			{ emitEvents: false, expected: false },
			{ emitEvents: undefined, expected: false },
		])('should pass emitEvents=$expected to updateBatch when given $emitEvents', async ({ emitEvents, expected }) => {
			const batchPayload = [{ id: 1, foo: 'a' }];
			await run({ payload: batchPayload, emitEvents });
			expect(ItemsService.prototype.updateBatch).toHaveBeenCalledWith(batchPayload, { emitEvents: expected });
		});
	});
});
