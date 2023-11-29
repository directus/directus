import { afterEach, describe, expect, test, vi } from 'vitest';

import { ItemsService } from '../../services/index.js';
import config from './index.js';

vi.mock('../../services/items.js', () => {
	const ItemsService = vi.fn();
	ItemsService.prototype.readByQuery = vi.fn();
	ItemsService.prototype.readOne = vi.fn();
	ItemsService.prototype.readMany = vi.fn();
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

describe('Operations / Item Read', () => {
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

		expect(ItemsService.prototype.readByQuery).toHaveBeenCalledWith({}, expect.anything());
	});

	test.each([undefined, []])('should call readByQuery with correct query when key is $payload', async (key) => {
		await config.handler(
			{ collection: testCollection, query: testQuery, key } as any,
			{ accountability: testAccountability, getSchema } as any,
		);

		expect(ItemsService.prototype.readByQuery).toHaveBeenCalledWith(testQuery, expect.anything());
		expect(ItemsService.prototype.readOne).not.toHaveBeenCalled();
		expect(ItemsService.prototype.readMany).not.toHaveBeenCalled();
	});

	test('should emit events for readByQuery when true', async () => {
		await config.handler(
			{ collection: testCollection, query: testQuery, emitEvents: true } as any,
			{ accountability: testAccountability, getSchema } as any,
		);

		expect(ItemsService.prototype.readByQuery).toHaveBeenCalledWith(testQuery, { emitEvents: true });
	});

	test.each([undefined, false])('should not emit events for readByQuery when %s', async (emitEvents) => {
		await config.handler(
			{ collection: testCollection, query: testQuery, emitEvents } as any,
			{ accountability: testAccountability, getSchema } as any,
		);

		expect(ItemsService.prototype.readByQuery).toHaveBeenCalledWith(testQuery, { emitEvents: false });
	});

	test.each([1, [1]])('should call readOne when key is $payload', async (key) => {
		await config.handler(
			{ collection: testCollection, key } as any,
			{ accountability: testAccountability, getSchema } as any,
		);

		expect(ItemsService.prototype.readByQuery).not.toHaveBeenCalled();
		expect(ItemsService.prototype.readOne).toHaveBeenCalled();
		expect(ItemsService.prototype.readMany).not.toHaveBeenCalled();
	});

	test('should emit events for readOne when true', async () => {
		const key = 1;

		await config.handler(
			{ collection: testCollection, key, emitEvents: true } as any,
			{ accountability: testAccountability, getSchema } as any,
		);

		expect(ItemsService.prototype.readOne).toHaveBeenCalledWith(key, {}, { emitEvents: true });
	});

	test.each([undefined, false])('should not emit events for readOne when %s', async (emitEvents) => {
		const key = 1;

		await config.handler(
			{ collection: testCollection, key, emitEvents } as any,
			{ accountability: testAccountability, getSchema } as any,
		);

		expect(ItemsService.prototype.readOne).toHaveBeenCalledWith(key, {}, { emitEvents: false });
	});

	test('should call readMany when key is an array with more than one item', async () => {
		await config.handler(
			{ collection: testCollection, key: [1, 2, 3] } as any,
			{ accountability: testAccountability, getSchema } as any,
		);

		expect(ItemsService.prototype.readByQuery).not.toHaveBeenCalled();
		expect(ItemsService.prototype.readOne).not.toHaveBeenCalled();
		expect(ItemsService.prototype.readMany).toHaveBeenCalled();
	});

	test('should emit events for readMany when true', async () => {
		const keys = [1, 2, 3];

		await config.handler(
			{ collection: testCollection, key: keys, emitEvents: true } as any,
			{ accountability: testAccountability, getSchema } as any,
		);

		expect(ItemsService.prototype.readMany).toHaveBeenCalledWith(keys, {}, { emitEvents: true });
	});

	test.each([undefined, false])('should not emit events for readMany when %s', async (emitEvents) => {
		const keys = [1, 2, 3];

		await config.handler(
			{ collection: testCollection, key: keys, emitEvents } as any,
			{ accountability: testAccountability, getSchema } as any,
		);

		expect(ItemsService.prototype.readMany).toHaveBeenCalledWith(keys, {}, { emitEvents: false });
	});
});
