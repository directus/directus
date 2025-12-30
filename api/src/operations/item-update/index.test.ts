import { afterEach, describe, expect, test, vi } from 'vitest';

vi.mock('../../services/items.js', () => {
	const ItemsService = vi.fn();
	ItemsService.prototype.updateByQuery = vi.fn();
	ItemsService.prototype.updateOne = vi.fn();
	ItemsService.prototype.updateMany = vi.fn();
	return { ItemsService };
});

vi.mock('../../utils/get-accountability-for-role.js', () => ({
	getAccountabilityForRole: vi.fn((role: string | null, _context) => Promise.resolve(role)),
}));

/* eslint-disable import/order */
import { ItemsService } from '../../services/items.js';
import config from './index.js';
/* eslint-enable import/order */

const testCollection = 'test';
const testPayload = {};
const testId = '00000000-0000-0000-0000-000000000000';
const testAccountability = { user: testId, role: testId };

const getSchema = vi.fn().mockResolvedValue({});

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
		await config.handler(
			{ collection: testCollection, payload: testPayload, permissions } as any,
			{ accountability: testAccountability, getSchema } as any,
		);

		expect(vi.mocked(ItemsService)).toHaveBeenCalledWith(
			testCollection,
			expect.objectContaining({ schema: {}, accountability: expected, knex: undefined }),
		);
	});

	test('should return null when payload is not defined', async () => {
		const result = await config.handler(
			{ collection: testCollection } as any,
			{ accountability: testAccountability, getSchema } as any,
		);

		expect(result).toBe(null);
		expect(vi.mocked(ItemsService).prototype.updateByQuery).not.toHaveBeenCalled();
		expect(vi.mocked(ItemsService).prototype.updateOne).not.toHaveBeenCalled();
		expect(vi.mocked(ItemsService).prototype.updateMany).not.toHaveBeenCalled();
	});

	test.each([undefined, []])('should call updateByQuery with correct query when key is $payload', async (key) => {
		const query = { limit: -1 };

		await config.handler(
			{ collection: testCollection, payload: testPayload, query, key } as any,
			{ accountability: testAccountability, getSchema } as any,
		);

		expect(vi.mocked(ItemsService).prototype.updateByQuery).toHaveBeenCalledWith(query, testPayload, expect.anything());
		expect(vi.mocked(ItemsService).prototype.updateOne).not.toHaveBeenCalled();
		expect(vi.mocked(ItemsService).prototype.updateMany).not.toHaveBeenCalled();
	});

	test('should emit events for updateByQuery when true', async () => {
		const query = { limit: -1 };

		await config.handler(
			{ collection: testCollection, payload: testPayload, query, emitEvents: true } as any,
			{ accountability: testAccountability, getSchema } as any,
		);

		expect(vi.mocked(ItemsService).prototype.updateByQuery).toHaveBeenCalledWith(query, testPayload, {
			emitEvents: true,
		});
	});

	test.each([undefined, false])('should not emit events for updateByQuery when %s', async (emitEvents) => {
		const query = { limit: -1 };

		await config.handler(
			{ collection: testCollection, payload: testPayload, query, emitEvents } as any,
			{ accountability: testAccountability, getSchema } as any,
		);

		expect(vi.mocked(ItemsService).prototype.updateByQuery).toHaveBeenCalledWith(query, testPayload, {
			emitEvents: false,
		});
	});

	test.each([1, [1]])('should call updateOne when key is $payload', async (key) => {
		await config.handler(
			{ collection: testCollection, payload: testPayload, key } as any,
			{ accountability: testAccountability, getSchema } as any,
		);

		expect(vi.mocked(ItemsService).prototype.updateByQuery).not.toHaveBeenCalled();
		expect(vi.mocked(ItemsService).prototype.updateOne).toHaveBeenCalled();
		expect(vi.mocked(ItemsService).prototype.updateMany).not.toHaveBeenCalled();
	});

	test('should emit events for updateOne when true', async () => {
		const key = 1;

		await config.handler(
			{ collection: testCollection, payload: testPayload, key, emitEvents: true } as any,
			{ accountability: testAccountability, getSchema } as any,
		);

		expect(vi.mocked(ItemsService).prototype.updateOne).toHaveBeenCalledWith(key, testPayload, { emitEvents: true });
	});

	test.each([undefined, false])('should not emit events for updateOne when %s', async (emitEvents) => {
		const key = 1;

		await config.handler(
			{ collection: testCollection, payload: testPayload, key: key, emitEvents } as any,
			{ accountability: testAccountability, getSchema } as any,
		);

		expect(vi.mocked(ItemsService).prototype.updateOne).toHaveBeenCalledWith(key, testPayload, { emitEvents: false });
	});

	test('should call updateMany when key is an array with more than one item', async () => {
		await config.handler(
			{ collection: testCollection, payload: testPayload, key: [1, 2, 3] } as any,
			{ accountability: testAccountability, getSchema } as any,
		);

		expect(vi.mocked(ItemsService).prototype.updateByQuery).not.toHaveBeenCalled();
		expect(vi.mocked(ItemsService).prototype.updateOne).not.toHaveBeenCalled();
		expect(vi.mocked(ItemsService).prototype.updateMany).toHaveBeenCalled();
	});

	test('should emit events for updateMany when true', async () => {
		const keys = [1, 2, 3];

		await config.handler(
			{ collection: testCollection, payload: testPayload, key: keys, emitEvents: true } as any,
			{ accountability: testAccountability, getSchema } as any,
		);

		expect(vi.mocked(ItemsService).prototype.updateMany).toHaveBeenCalledWith(keys, testPayload, { emitEvents: true });
	});

	test.each([undefined, false])('should not emit events for updateMany when %s', async (emitEvents) => {
		const keys = [1, 2, 3];

		await config.handler(
			{ collection: testCollection, payload: testPayload, key: keys, emitEvents } as any,
			{ accountability: testAccountability, getSchema } as any,
		);

		expect(vi.mocked(ItemsService).prototype.updateMany).toHaveBeenCalledWith(keys, testPayload, { emitEvents: false });
	});
});
