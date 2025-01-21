import { useEnv } from '@directus/env';
import { toArray } from '@directus/utils';
import { randomUUID } from 'node:crypto';
import { Readable } from 'node:stream';
import { AggregatorRegistry, Counter, Histogram } from 'prom-client';
import { getCache } from '../../cache.js';
import { hasDatabaseConnection } from '../../database/index.js';
import { redisConfigAvailable, useRedis } from '../../redis/index.js';
import { getStorage } from '../../storage/index.js';

export function createMetrics() {
	const env = useEnv();

	const registry = new AggregatorRegistry();

	async function generate() {
		const checkId = randomUUID();

		await Promise.all([
			trackDatabaseMetric(),
			trackCacheMetric(checkId),
			trackRedisMetric(checkId),
			trackStorageMetric(checkId),
		]);
	}

	function readAll(): Promise<string> {
		return registry.metrics();
	}

	function getDatabaseErrorMetric(): Counter | null {
		if (env['METRICS_DATABASE_ENABLED'] !== true) {
			return null;
		}

		const client = env['DB_CLIENT'];

		let metric = registry.getSingleMetric(`directus_db_${client}_connection_errors`) as Counter | undefined;

		if (!metric) {
			metric = new Counter({
				name: `directus_db_${client}_connection_errors`,
				help: `${client} Database connection error count`,
				registers: [registry],
			});
		}

		return metric;
	}

	function getDatabaseResponseMetric(): Histogram | null {
		if (env['METRICS_DATABASE_ENABLED'] !== true) {
			return null;
		}

		const client = env['DB_CLIENT'];

		let metric = registry.getSingleMetric(`directus_db_${client}_response_time_ms`) as Histogram | undefined;

		if (!metric) {
			metric = new Histogram({
				name: `directus_db_${client}_response_time_ms`,
				help: `${client} Database connection response time`,
				registers: [registry],
			});
		}

		return metric;
	}

	function getCacheErrorMetric(): Counter | null {
		if (env['METRICS_CACHE_ENABLED'] !== true || env['CACHE_ENABLED'] !== true) {
			return null;
		}

		if (env['CACHE_STORE'] === 'redis' && redisConfigAvailable() !== true) {
			return null;
		}

		let metric = registry.getSingleMetric(`directus_cache_${env['CACHE_STORE']}_connection_errors`) as
			| Counter
			| undefined;

		if (!metric) {
			metric = new Counter({
				name: `directus_cache_${env['CACHE_STORE']}_connection_errors`,
				help: 'Cache connection error count',
				registers: [registry],
			});
		}

		return metric;
	}

	function getRedisErrorMetric(): Counter | null {
		if (env['METRICS_REDIS_ENABLED'] !== true || redisConfigAvailable() !== true) {
			return null;
		}

		let metric = registry.getSingleMetric('directus_redis_connection_errors') as Counter | undefined;

		if (!metric) {
			metric = new Counter({
				name: `directus_redis_connection_errors`,
				help: 'Redis connection error count',
				registers: [registry],
			});
		}

		return metric;
	}

	function getStorageErrorMetric(location: string): Counter | null {
		if (env['METRICS_STORAGE_ENABLED'] !== true) {
			return null;
		}

		let metric = registry.getSingleMetric(`directus_storage_${location}_connection_errors`) as Counter | undefined;

		if (!metric) {
			metric = new Counter({
				name: `directus_storage_${location}_connection_errors`,
				help: `${location} storage connection error count`,
				registers: [registry],
			});
		}

		return metric;
	}

	async function trackDatabaseMetric(): Promise<void> {
		const metric = getDatabaseErrorMetric();

		if (metric === null) {
			return;
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

	async function trackCacheMetric(checkId: string): Promise<void> {
		const metric = getCacheErrorMetric();

		if (metric === null) {
			return;
		}

		const { cache } = getCache();

		if (!cache) {
			return;
		}

		try {
			await cache.set(`metrics-${checkId}`, '1', 5);
			await cache.delete(`metrics-${checkId}`);
		} catch {
			metric.inc();
		}
	}

	async function trackRedisMetric(checkId: string) {
		const metric = getRedisErrorMetric();

		if (metric === null) {
			return;
		}

		const redis = useRedis();

		try {
			await redis.set(`metrics-${checkId}`, '1');
			await redis.del(`metrics-${checkId}`);
		} catch {
			metric.inc();
		}
	}

	async function trackStorageMetric(checkId: string) {
		if (env['METRICS_STORAGE_ENABLED'] !== true) {
			return;
		}

		const storage = await getStorage();

		for (const location of toArray(env['STORAGE_LOCATIONS'] as string)) {
			const disk = storage.location(location);

			const metric = getStorageErrorMetric(location);

			if (metric === null) {
				continue;
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
		getDatabaseErrorMetric,
		getDatabaseResponseMetric,
		getCacheErrorMetric,
		getRedisErrorMetric,
		getStorageErrorMetric,
		generate,
		readAll,
	};
}
