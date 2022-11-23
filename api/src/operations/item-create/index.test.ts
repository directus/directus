import { afterEach, describe, expect, test, vi } from 'vitest';

import { ItemsService } from '../../services';
import config from './index';

vi.mock('../../services', () => {
	const ItemsService = vi.fn();
	ItemsService.prototype.createMany = vi.fn();
	return { ItemsService };
});

const getSchema = vi.fn().mockResolvedValue({});

vi.mock('../../utils/get-accountability-for-role', () => ({
	getAccountabilityForRole: vi.fn((role: string | null, _context) => Promise.resolve(role)),
}));

const testCollection = 'test';
const testId = '00000000-0000-0000-0000-000000000000';
const testAccountability = { user: testId, role: testId };

describe('Operations / Item Create', () => {
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
			{ collection: testCollection, permissions } as any,
			{ accountability: testAccountability, getSchema } as any
		);

		expect(ItemsService).toHaveBeenCalledWith(
			testCollection,
			expect.objectContaining({ schema: {}, accountability: expected, knex: undefined })
		);
	});

	test.each([
		{ payload: null, expected: null },
		{ payload: { test: 'test' }, expected: [{ test: 'test' }] },
	])('payload $payload should be passed as $expected', async ({ payload, expected }) => {
		await config.handler(
			{ collection: testCollection, payload } as any,
			{ accountability: testAccountability, getSchema } as any
		);

		if (expected) {
			expect(ItemsService.prototype.createMany).toHaveBeenCalledWith(expected, expect.anything());
		} else {
			expect(ItemsService.prototype.createMany).not.toHaveBeenCalled();
		}
	});

	test('should emit events when true', async () => {
		await config.handler(
			{ collection: testCollection, payload: {}, emitEvents: true } as any,
			{ accountability: testAccountability, getSchema } as any
		);

		expect(ItemsService.prototype.createMany).toHaveBeenCalledWith([{}], { emitEvents: true });
	});

	test.each([undefined, false])('should not emit events when %s', async (emitEvents) => {
		await config.handler(
			{ collection: testCollection, payload: {}, emitEvents } as any,
			{ accountability: testAccountability, getSchema } as any
		);

		expect(ItemsService.prototype.createMany).toHaveBeenCalledWith([{}], { emitEvents: false });
	});
});
