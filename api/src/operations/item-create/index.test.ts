import { afterEach, expect, test, vi } from 'vitest';

vi.mock('../../services', () => {
	const ItemsService = vi.fn();
	ItemsService.prototype.createMany = vi.fn();
	return { ItemsService };
});

vi.mock('../../utils/get-accountability-for-role', () => ({
	getAccountabilityForRole: vi.fn((role: string | null, _context) => Promise.resolve(role)),
}));

import { ItemsService } from '../../services';
import config from './index';

const testCollection = 'test';
const testId = '00000000-0000-0000-0000-000000000000';
const testAccountability = { user: testId, role: testId };

const getSchema = vi.fn().mockResolvedValue({});

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

	expect(vi.mocked(ItemsService)).toHaveBeenCalledWith(
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
		expect(vi.mocked(ItemsService).prototype.createMany).toHaveBeenCalledWith(expected, expect.anything());
	} else {
		expect(vi.mocked(ItemsService).prototype.createMany).not.toHaveBeenCalled();
	}
});

test('should emit events when true', async () => {
	await config.handler(
		{ collection: testCollection, payload: {}, emitEvents: true } as any,
		{ accountability: testAccountability, getSchema } as any
	);

	expect(vi.mocked(ItemsService).prototype.createMany).toHaveBeenCalledWith([{}], { emitEvents: true });
});

test.each([undefined, false])('should not emit events when %s', async (emitEvents) => {
	await config.handler(
		{ collection: testCollection, payload: {}, emitEvents } as any,
		{ accountability: testAccountability, getSchema } as any
	);

	expect(vi.mocked(ItemsService).prototype.createMany).toHaveBeenCalledWith([{}], { emitEvents: false });
});
