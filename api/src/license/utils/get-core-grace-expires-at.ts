import type { Item } from '@directus/types';
import { ItemsService } from '../../services/items.js';
import { getSchema } from '../../utils/get-schema.js';

const V12_MIGRATION_VERSION = '20260507A';
const CLEAN_INSTALL_MS = 24 * 60 * 60 * 1000; // 1 day

export const GRACE_PERIOD_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export const _cache: { migrations: { oldest: Item | undefined; v12: Item | undefined } | undefined } = {
	migrations: undefined,
};

/**
 * V12 migration timestamp in seconds, used as the Core "expires_at" during the upgrade grace.
 * Returns `null` when no grace applies.
 */
export async function getCoreGraceExpiresAt(): Promise<number | null> {
	if (!_cache.migrations) {
		const itemsService = new ItemsService('directus_migrations', {
			schema: await getSchema(),
		});

		const [oldest, v12] = await Promise.all([
			itemsService
				.readByQuery({
					fields: ['timestamp'],
					sort: ['timestamp'],
					limit: 1,
				})
				.then((r) => r[0]),
			itemsService
				.readByQuery({
					fields: ['timestamp'],
					filter: { version: { _eq: V12_MIGRATION_VERSION } },
					limit: 1,
				})
				.then((r) => r[0]),
		]);

		_cache.migrations = {
			oldest,
			v12,
		};
	}

	if (!_cache.migrations.oldest || !_cache.migrations.v12) return null;

	const start = new Date(_cache.migrations.oldest['timestamp']).getTime();
	const upgrade = new Date(_cache.migrations.v12['timestamp']).getTime();

	if (upgrade - start < CLEAN_INSTALL_MS) return null;

	return Math.floor(upgrade / 1000);
}
