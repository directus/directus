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
		test.each([
			{
				scenario: 'both a single key and query are provided',
				options: { key: [1], query: testQuery },
				reason: 'Cannot use both "keys" and "query"',
			},
			{
				scenario: 'both multiple keys and query are provided',
				options: { key: [1, 2], query: testQuery },
				reason: 'Cannot use both "keys" and "query"',
			},
		])('should throw when $scenario', async ({ options, reason }) => {
			await expect(run(options)).rejects.toThrow(reason);

			expect(ItemsService.prototype.deleteByQuery).not.toHaveBeenCalled();
			expect(ItemsService.prototype.deleteMany).not.toHaveBeenCalled();
		});
	});

	describe('no-op', () => {
		test.each([
			{ scenario: 'nothing at all', options: {} },
			{ scenario: 'only an empty keys array', options: { key: [] } },
			{ scenario: 'only an empty key string', options: { key: '' } },
			{ scenario: 'empty keys and a null query', options: { key: [], query: null } },
			{ scenario: 'an empty query object', options: { query: {} } },
			{ scenario: 'empty keys and an empty query object', options: { key: [], query: {} } },
			{ scenario: 'an empty query object as a JSON string', options: { query: '{}' } },
		])('should return null and call nothing when given $scenario', async ({ options }) => {
			const result = await run(options);

			expect(result).toBe(null);
			expect(ItemsService.prototype.deleteByQuery).not.toHaveBeenCalled();
			expect(ItemsService.prototype.deleteMany).not.toHaveBeenCalled();
		});
	});

	describe('routing', () => {
		test.each([
			{ scenario: 'undefined', key: undefined },
			{ scenario: 'an empty array', key: [] },
		])('should call deleteByQuery when query is set and key is $scenario', async ({ key }) => {
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

		test('should call deleteByQuery when query is a JSON string', async () => {
			await run({ query: '{"limit":-1}' });

			expect(ItemsService.prototype.deleteByQuery).toHaveBeenCalledWith({ limit: -1 }, expect.anything());
		});

		test('should call deleteMany when keys are combined with an empty query object', async () => {
			await run({ key: [1, 2], query: {} });

			expect(ItemsService.prototype.deleteMany).toHaveBeenCalledWith([1, 2], expect.anything());
			expect(ItemsService.prototype.deleteByQuery).not.toHaveBeenCalled();
		});
	});

	describe('return value', () => {
		test.each([
			{ scenario: 'a scalar', key: 1 },
			{ scenario: 'an array', key: [1] },
		])('should return the scalar key for a single-key delete when key is $scenario', async ({ key }) => {
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
