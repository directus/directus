import { afterEach, describe, expect, test, vi } from 'vitest';

import { ItemsService } from '../../services/items.js';
import config from './index.js';

vi.mock('../../services/items.js', () => {
	const ItemsService = vi.fn();
	ItemsService.prototype.deleteByQuery = vi.fn();
	ItemsService.prototype.deleteOne = vi.fn();
	ItemsService.prototype.deleteMany = vi.fn();
	return { ItemsService };
});

const getSchema = vi.fn().mockResolvedValue({});

vi.mock('../../utils/get-accountability-for-role.js', () => ({
	getAccountabilityForRole: vi.fn((role: string | null, _context) => Promise.resolve(role)),
}));

const testCollection = 'test';
const testQuery = { limit: -1 };
const testId = '00000000-0000-0000-0000-000000000000';
const testAccountability = { user: testId, role: testId };

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
		await config.handler(
			{ collection: testCollection, query: testQuery, permissions } as any,
			{ accountability: testAccountability, getSchema } as any,
		);

		expect(ItemsService).toHaveBeenCalledWith(
			testCollection,
			expect.objectContaining({ schema: {}, accountability: expected, knex: undefined }),
		);
	});

	test('should have fallback when query is not defined', async () => {
		await config.handler(
			{ collection: testCollection } as any,
			{ accountability: testAccountability, getSchema } as any,
		);

		expect(ItemsService.prototype.deleteByQuery).toHaveBeenCalledWith({}, expect.anything());
	});

	test.each([undefined, []])('should call deleteByQuery with correct query when key is $payload', async (key) => {
		await config.handler(
			{ collection: testCollection, query: testQuery, key } as any,
			{ accountability: testAccountability, getSchema } as any,
		);

		expect(ItemsService.prototype.deleteByQuery).toHaveBeenCalledWith(testQuery, expect.anything());
		expect(ItemsService.prototype.deleteOne).not.toHaveBeenCalled();
		expect(ItemsService.prototype.deleteMany).not.toHaveBeenCalled();
	});

	test('should emit events for deleteByQuery when true', async () => {
		await config.handler(
			{ collection: testCollection, query: testQuery, emitEvents: true } as any,
			{ accountability: testAccountability, getSchema } as any,
		);

		expect(ItemsService.prototype.deleteByQuery).toHaveBeenCalledWith(testQuery, { emitEvents: true });
	});

	test.each([undefined, false])('should not emit events for deleteByQuery when %s', async (emitEvents) => {
		await config.handler(
			{ collection: testCollection, query: testQuery, emitEvents } as any,
			{ accountability: testAccountability, getSchema } as any,
		);

		expect(ItemsService.prototype.deleteByQuery).toHaveBeenCalledWith(testQuery, { emitEvents: false });
	});

	test.each([1, [1]])('should call deleteOne when key is $payload', async (key) => {
		await config.handler(
			{ collection: testCollection, key } as any,
			{ accountability: testAccountability, getSchema } as any,
		);

		expect(ItemsService.prototype.deleteByQuery).not.toHaveBeenCalled();
		expect(ItemsService.prototype.deleteOne).toHaveBeenCalled();
		expect(ItemsService.prototype.deleteMany).not.toHaveBeenCalled();
	});

	test('should emit events for deleteOne when true', async () => {
		const key = 1;

		await config.handler(
			{ collection: testCollection, key, emitEvents: true } as any,
			{ accountability: testAccountability, getSchema } as any,
		);

		expect(ItemsService.prototype.deleteOne).toHaveBeenCalledWith(key, { emitEvents: true });
	});

	test.each([undefined, false])('should not emit events for deleteOne when %s', async (emitEvents) => {
		const key = 1;

		await config.handler(
			{ collection: testCollection, key, emitEvents } as any,
			{ accountability: testAccountability, getSchema } as any,
		);

		expect(ItemsService.prototype.deleteOne).toHaveBeenCalledWith(key, { emitEvents: false });
	});

	test('should call deleteMany when key is an array with more than one item', async () => {
		await config.handler(
			{ collection: testCollection, key: [1, 2, 3] } as any,
			{ accountability: testAccountability, getSchema } as any,
		);

		expect(ItemsService.prototype.deleteByQuery).not.toHaveBeenCalled();
		expect(ItemsService.prototype.deleteOne).not.toHaveBeenCalled();
		expect(ItemsService.prototype.deleteMany).toHaveBeenCalled();
	});

	test('should emit events for deleteMany when true', async () => {
		const keys = [1, 2, 3];

		await config.handler(
			{ collection: testCollection, key: keys, emitEvents: true } as any,
			{ accountability: testAccountability, getSchema } as any,
		);

		expect(ItemsService.prototype.deleteMany).toHaveBeenCalledWith(keys, { emitEvents: true });
	});

	test.each([undefined, false])('should not emit events for deleteMany when %s', async (emitEvents) => {
		const keys = [1, 2, 3];

		await config.handler(
			{ collection: testCollection, key: keys, emitEvents } as any,
			{ accountability: testAccountability, getSchema } as any,
		);

		expect(ItemsService.prototype.deleteMany).toHaveBeenCalledWith(keys, { emitEvents: false });
	});
});
