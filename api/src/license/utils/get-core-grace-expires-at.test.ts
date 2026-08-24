import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { ItemsService } from '../../services/items.js';
import { _cache, getCoreGraceExpiresAt } from './get-core-grace-expires-at.js';

vi.mock('../../services/items.js', async () => {
	const { mockItemsService } = await import('../../test-utils/services/items-service.js');
	return mockItemsService();
});

vi.mock('../../utils/get-schema.js', () => ({
	getSchema: vi.fn().mockResolvedValue({}),
}));

const FIXED_NOW_MS = 1_735_689_600_000; // 2025-01-01T00:00:00Z
const DAY_MS = 24 * 60 * 60 * 1000;

beforeEach(() => {
	vi.useFakeTimers({ now: FIXED_NOW_MS });
	_cache.migrations = undefined;
});

afterEach(() => {
	vi.useRealTimers();
	vi.clearAllMocks();
});

describe('no grace applies', () => {
	test('no migrations exist returns null', async () => {
		vi.spyOn(ItemsService.prototype, 'readByQuery').mockResolvedValueOnce([]).mockResolvedValueOnce([]);

		await expect(getCoreGraceExpiresAt()).resolves.toBeNull();
	});

	test('v12 migration not found returns null', async () => {
		vi.spyOn(ItemsService.prototype, 'readByQuery')
			.mockResolvedValueOnce([{ timestamp: new Date(FIXED_NOW_MS - 365 * DAY_MS).toISOString() }])
			.mockResolvedValueOnce([]);

		await expect(getCoreGraceExpiresAt()).resolves.toBeNull();
	});

	test('clean v12 install returns null', async () => {
		vi.spyOn(ItemsService.prototype, 'readByQuery')
			.mockResolvedValueOnce([{ timestamp: new Date(FIXED_NOW_MS - 60 * 1000).toISOString() }])
			.mockResolvedValueOnce([{ timestamp: new Date(FIXED_NOW_MS).toISOString() }]);

		await expect(getCoreGraceExpiresAt()).resolves.toBeNull();
	});
});

test('upgrade returns v12 timestamp in seconds', async () => {
	const v12Ms = FIXED_NOW_MS - 5 * DAY_MS;

	vi.spyOn(ItemsService.prototype, 'readByQuery')
		.mockResolvedValueOnce([{ timestamp: new Date(FIXED_NOW_MS - 365 * DAY_MS).toISOString() }])
		.mockResolvedValueOnce([{ timestamp: new Date(v12Ms).toISOString() }]);

	await expect(getCoreGraceExpiresAt()).resolves.toBe(Math.floor(v12Ms / 1000));
});

describe('caching', () => {
	test('repeated calls will only ever call directus_migrations once', async () => {
		const spy = vi
			.spyOn(ItemsService.prototype, 'readByQuery')
			.mockResolvedValueOnce([{ timestamp: new Date(FIXED_NOW_MS - 365 * DAY_MS).toISOString() }])
			.mockResolvedValueOnce([{ timestamp: new Date(FIXED_NOW_MS - 5 * DAY_MS).toISOString() }]);

		await getCoreGraceExpiresAt();
		await getCoreGraceExpiresAt();
		await getCoreGraceExpiresAt();

		expect(spy).toHaveBeenCalledTimes(2);
	});
});
