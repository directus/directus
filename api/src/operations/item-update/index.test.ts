import { InvalidPayloadError } from '@directus/errors';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { ItemsService } from '../../services/items.js';
import { getService } from '../../utils/get-service.js';
import config from './index.js';

vi.mock('../../services/items.js', async () => {
	const { mockItemsService } = await import('../../test-utils/services/items-service.js');
	return mockItemsService();
});

vi.mock('../../utils/get-service.js', async () => {
	const { ItemsService } = await import('../../services/items.js');
	return { getService: vi.fn((collection, options) => new ItemsService(collection, options)) };
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
		await run({ payload: testPayload, key: 1, permissions });

		expect(vi.mocked(ItemsService)).toHaveBeenCalledWith(
			testCollection,
			expect.objectContaining({ schema: {}, accountability: expected, knex: undefined }),
		);

		expect(vi.mocked(getService)).toHaveBeenCalledWith(
			testCollection,
			expect.objectContaining({ schema: {}, accountability: expected, knex: undefined }),
		);
	});

	describe('input shape validation', () => {
		test.each([
			{ scenario: 'query is not an object', options: { payload: testPayload, query: 5 } },
			{ scenario: 'payload is not an object or array', options: { payload: 5 } },
			{ scenario: 'payload is not an object or array as a JSON string', options: { payload: '5' } },
			{ scenario: 'payload is a falsy number', options: { payload: 0 } },
			{ scenario: 'payload is a falsy number as a JSON string', options: { payload: '0' } },
			{ scenario: 'payload is a falsy boolean', options: { payload: false } },
			{ scenario: 'payload is a falsy boolean as a JSON string', options: { payload: 'false' } },
			{ scenario: 'payload is an empty string as a JSON string', options: { payload: '""' } },
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
			{
				scenario: 'both a single key and query are provided',
				options: { key: [1], query: { limit: -1 } },
				reason: 'Cannot use both "key" and "query"',
			},
			{
				scenario: 'both multiple keys and query are provided',
				options: { key: [1, 2], query: { limit: -1 } },
				reason: 'Cannot use both "key" and "query"',
			},
			{
				scenario: 'a batch payload is combined with keys',
				options: { payload: [{ id: 1, foo: 'a' }], key: [1] },
				reason: 'Cannot use "key" or "query" with a batch payload',
			},
			{
				scenario: 'a batch payload is combined with a query',
				options: { payload: [{ id: 1, foo: 'a' }], query: { limit: -1 } },
				reason: 'Cannot use "key" or "query" with a batch payload',
			},
			{
				scenario: 'a batch payload is combined with both keys and a query',
				options: { payload: [{ id: 1, foo: 'a' }], key: [1], query: { limit: -1 } },
				reason: 'Cannot use both "key" and "query"',
			},
		])('should throw when $scenario', async ({ options, reason }) => {
			await expect(run({ payload: testPayload, ...options })).rejects.toThrow(reason);

			expect(ItemsService.prototype.updateByQuery).not.toHaveBeenCalled();
			expect(ItemsService.prototype.updateMany).not.toHaveBeenCalled();
			expect(ItemsService.prototype.updateBatch).not.toHaveBeenCalled();
		});
	});

	describe('no-op', () => {
		test.each([
			{ scenario: 'nothing at all', options: {} },
			{ scenario: 'a key but no payload', options: { key: 1 } },
			{ scenario: 'a key and a null payload', options: { key: 1, payload: null } },
			{ scenario: 'a key and a null payload as a JSON string', options: { key: 1, payload: 'null' } },
			{ scenario: 'a query but no payload', options: { query: { limit: -1 } } },
			{ scenario: 'only an empty keys array', options: { key: [] } },
			{ scenario: 'an empty payload object', options: { payload: {}, key: 1 } },
			{ scenario: 'an empty payload object and a query', options: { payload: {}, query: { limit: -1 } } },
			{ scenario: 'an empty payload object as a JSON string', options: { payload: '{}', key: 1 } },
			{ scenario: 'an empty batch payload', options: { payload: [] } },
			{ scenario: 'a payload but no keys or query', options: { payload: testPayload } },
			{ scenario: 'a payload and empty keys', options: { payload: testPayload, key: [] } },
			{ scenario: 'a payload and an empty key string', options: { payload: testPayload, key: '' } },
			{ scenario: 'a payload, empty keys and a null query', options: { payload: testPayload, key: [], query: null } },
			{ scenario: 'a payload and an empty query object', options: { payload: testPayload, query: {} } },
			{
				scenario: 'a payload and an empty query object as a JSON string',
				options: { payload: testPayload, query: '{}' },
			},
			{ scenario: 'a payload, empty keys and an empty query', options: { payload: testPayload, key: [], query: {} } },
		])('should return null and call nothing when given $scenario', async ({ options }) => {
			const result = await run(options);

			expect(result).toBe(null);
			expect(ItemsService.prototype.updateByQuery).not.toHaveBeenCalled();
			expect(ItemsService.prototype.updateMany).not.toHaveBeenCalled();
			expect(ItemsService.prototype.updateBatch).not.toHaveBeenCalled();
		});
	});

	describe('routing', () => {
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

		test.each([
			{ scenario: 'undefined', key: undefined },
			{ scenario: 'an empty array', key: [] },
		])('should call updateByQuery when query is set and key is $scenario', async ({ key }) => {
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

		test('should call updateMany when payload is a JSON string', async () => {
			await run({ payload: JSON.stringify(testPayload), key: [1, 2] });

			expect(ItemsService.prototype.updateMany).toHaveBeenCalledWith([1, 2], testPayload, expect.anything());
		});

		test('should call updateByQuery when query is a JSON string', async () => {
			await run({ payload: testPayload, query: '{"limit":-1}' });

			expect(ItemsService.prototype.updateByQuery).toHaveBeenCalledWith({ limit: -1 }, testPayload, expect.anything());
		});

		test('should call updateMany when keys are combined with an empty query object', async () => {
			await run({ payload: testPayload, key: [1, 2], query: {} });

			expect(ItemsService.prototype.updateMany).toHaveBeenCalledWith([1, 2], testPayload, expect.anything());
			expect(ItemsService.prototype.updateByQuery).not.toHaveBeenCalled();
		});

		test('should call updateBatch when a batch payload is combined with empty keys and an empty query', async () => {
			const batchPayload = [{ id: 1, foo: 'a' }];

			await run({ payload: batchPayload, key: [], query: {} });

			expect(ItemsService.prototype.updateBatch).toHaveBeenCalledWith(batchPayload, expect.anything());
			expect(ItemsService.prototype.updateMany).not.toHaveBeenCalled();
			expect(ItemsService.prototype.updateByQuery).not.toHaveBeenCalled();
		});
	});

	describe('return value', () => {
		test.each([
			{ scenario: 'a scalar', key: 1 },
			{ scenario: 'an array', key: [1] },
		])('should return the scalar key for a single-key update when key is $scenario', async ({ key }) => {
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
