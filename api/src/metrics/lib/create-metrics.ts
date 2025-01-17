import { useEnv } from '@directus/env';
import { toArray } from '@directus/utils';
import { randomUUID } from 'node:crypto';
import { Readable } from 'node:stream';
import { Counter, register } from 'prom-client';
import { getCache } from '../../cache.js';
import { hasDatabaseConnection } from '../../database/index.js';
import { redisConfigAvailable, useRedis } from '../../redis/index.js';
import { getStorage } from '../../storage/index.js';

export function createMetrics() {
	const env = useEnv();

	async function generate() {
		const checkId = randomUUID();

		await Promise.all([
			getDatabaseMetric(),
			getCacheMetric(checkId),
			getRedisMetric(checkId),
			getStorageMetric(checkId),
		]);
	}

	function readAll(): Promise<string> {
		return register.metrics();
	}

	async function getDatabaseMetric(): Promise<void> {
		if (env['METRICS_DATABASE_ENABLED'] !== true) {
			return;
		}

		const client = env['DB_CLIENT'];

		let metric = register.getSingleMetric(`directus_db_${client}_connection_errors`) as Counter | undefined;

		if (!metric) {
			metric = new Counter({
				name: `directus_db_${client}_connection_errors`,
				help: `${client} Database connection error count`,
			});
		}

		try {
			// if no connection indicate issue via zero value
			if (!(await hasDatabaseConnection())) {
				metric.inc();
			}
		} catch {
			metric.inc();
		}
	}

	async function getCacheMetric(checkId: string): Promise<void> {
		if (env['METRICS_CACHE_ENABLED'] !== true || env['CACHE_ENABLED'] !== true) {
			return;
		}

		if (env['CACHE_STORE'] === 'redis' && redisConfigAvailable() !== true) {
			return;
		}

		const { cache } = getCache();

		if (!cache) {
			return;
		}

		let metric = register.getSingleMetric('directus_cache_connection_errors') as Counter | undefined;

		if (!metric) {
			metric = new Counter({
				name: `directus_cache_connection_errors`,
				help: 'Cache connection error count',
			});
		}

		try {
			await cache.set(`metrics-${checkId}`, '1', 5);
			await cache.delete(`metrics-${checkId}`);
		} catch {
			metric.inc();
		}
	}

	async function getRedisMetric(checkId: string) {
		if (env['METRICS_REDIS_ENABLED'] !== true || redisConfigAvailable() !== true) {
			return;
		}

		const redis = useRedis();

		let metric = register.getSingleMetric('directus_redis_connection_errors') as Counter | undefined;

		if (!metric) {
			metric = new Counter({
				name: `directus_redis_connection_errors`,
				help: 'Redis connection error count',
			});
		}

		try {
			await redis.set(`metrics-${checkId}`, '1');
			await redis.del(`metrics-${checkId}`);
		} catch {
			metric.inc();
		}
	}

	async function getStorageMetric(checkId: string) {
		if (env['METRICS_STORAGE_ENABLED'] !== true) {
			return;
		}

		const storage = await getStorage();

		for (const location of toArray(env['STORAGE_LOCATIONS'] as string)) {
			const disk = storage.location(location);

			let metric = register.getSingleMetric(`directus_storage_${location}_connection_errors`) as Counter | undefined;

			if (!metric) {
				metric = new Counter({
					name: `directus_storage_${location}_connection_errors`,
					help: `${location} storage connection error count`,
				});
			}

			try {
				await disk.write(`metric-${checkId}`, Readable.from(['check']));
				const fileStream = await disk.read(`metric-${checkId}`);

				await new Promise((resolve) =>
					fileStream.on('data', async () => {
						fileStream.destroy();
						await disk.delete(`metric-${checkId}`);
						return resolve(null);
					}),
				);
			} catch {
				metric.inc();
			}
		}
	}

	return {
		generate,
		readAll,
	};
}
