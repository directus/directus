import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { ItemsService } from '../../services/items.js';
import { _cache, isInCoreGracePeriod } from './is-in-core-grace-period.js';

vi.mock('../../services/items.js', async () => {
	const { mockItemsService } = await import('../../test-utils/services/items-service.js');
	return mockItemsService();
});

vi.mock('../../utils/get-schema.js', () => ({
	getSchema: vi.fn().mockResolvedValue({}),
}));

const V12_MIGRATION_VERSION = '20260507A';
const DAY_MS = 24 * 60 * 60 * 1000;

describe('isInCoreGracePeriod', () => {
	beforeEach(() => {
		_cache.migrations = undefined;
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe('returns false when grace is not applicable', () => {
		test('no migrations exist', async () => {
			vi.spyOn(ItemsService.prototype, 'readByQuery').mockResolvedValueOnce([]).mockResolvedValueOnce([]);

			await expect(isInCoreGracePeriod()).resolves.toBe(false);
		});

		test('the v12 migration has not been applied yet', async () => {
			vi.spyOn(ItemsService.prototype, 'readByQuery')
				.mockResolvedValueOnce([{ timestamp: new Date(Date.now() - 365 * DAY_MS).toISOString() }])
				.mockResolvedValueOnce([]);

			await expect(isInCoreGracePeriod()).resolves.toBe(false);
		});

		test('the database is a clean v12 install (oldest and v12 within 24h)', async () => {
			const now = Date.now();

			vi.spyOn(ItemsService.prototype, 'readByQuery')
				.mockResolvedValueOnce([{ timestamp: new Date(now - 60 * 1000).toISOString() }])
				.mockResolvedValueOnce([{ timestamp: new Date(now).toISOString() }]);

			await expect(isInCoreGracePeriod()).resolves.toBe(false);
		});
	});

	describe('grace window (30 days since v12 upgrade)', () => {
		test('returns true while still within 30 days', async () => {
			const now = Date.now();

			vi.spyOn(ItemsService.prototype, 'readByQuery')
				.mockResolvedValueOnce([{ timestamp: new Date(now - 365 * DAY_MS).toISOString() }])
				.mockResolvedValueOnce([{ timestamp: new Date(now - 5 * DAY_MS).toISOString() }]);

			await expect(isInCoreGracePeriod()).resolves.toBe(true);
		});

		test('returns false after 30 days have passed', async () => {
			const now = Date.now();

			vi.spyOn(ItemsService.prototype, 'readByQuery')
				.mockResolvedValueOnce([{ timestamp: new Date(now - 365 * DAY_MS).toISOString() }])
				.mockResolvedValueOnce([{ timestamp: new Date(now - 31 * DAY_MS).toISOString() }]);

			await expect(isInCoreGracePeriod()).resolves.toBe(false);
		});
	});

	describe('caching', () => {
		test('does not re-query directus_migrations on subsequent calls', async () => {
			const now = Date.now();

			const spy = vi
				.spyOn(ItemsService.prototype, 'readByQuery')
				.mockResolvedValueOnce([{ timestamp: new Date(now - 365 * DAY_MS).toISOString() }])
				.mockResolvedValueOnce([{ timestamp: new Date(now - 5 * DAY_MS).toISOString() }]);

			await isInCoreGracePeriod();
			await isInCoreGracePeriod();
			await isInCoreGracePeriod();

			expect(spy).toHaveBeenCalledTimes(2);
		});

		test('queries again after the cache is cleared', async () => {
			const now = Date.now();
			const oldestTs = new Date(now - 365 * DAY_MS).toISOString();
			const v12Ts = new Date(now - 5 * DAY_MS).toISOString();

			const spy = vi
				.spyOn(ItemsService.prototype, 'readByQuery')
				.mockResolvedValueOnce([{ timestamp: oldestTs }])
				.mockResolvedValueOnce([{ timestamp: v12Ts }])
				.mockResolvedValueOnce([{ timestamp: oldestTs }])
				.mockResolvedValueOnce([{ timestamp: v12Ts }]);

			await isInCoreGracePeriod();
			_cache.migrations = undefined;
			await isInCoreGracePeriod();

			expect(spy).toHaveBeenCalledTimes(4);
		});
	});

	test('queries directus_migrations with the correct schema and filters', async () => {
		const spy = vi.spyOn(ItemsService.prototype, 'readByQuery').mockResolvedValueOnce([]).mockResolvedValueOnce([]);

		await isInCoreGracePeriod();

		expect(ItemsService).toHaveBeenCalledWith('directus_migrations', { schema: {} });

		expect(spy).toHaveBeenCalledWith({
			fields: ['timestamp'],
			sort: ['timestamp'],
			limit: 1,
		});

		expect(spy).toHaveBeenCalledWith({
			fields: ['timestamp'],
			filter: { version: { _eq: V12_MIGRATION_VERSION } },
			limit: 1,
		});
	});
});
