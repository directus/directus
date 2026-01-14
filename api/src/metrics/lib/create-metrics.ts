import { randomUUID } from 'node:crypto';
import { Readable } from 'node:stream';
import { promisify } from 'node:util';
import { useEnv } from '@directus/env';
import { toArray } from '@directus/utils';
import pm2 from 'pm2';
import type { MetricObjectWithValues, MetricValue } from 'prom-client';
import { AggregatorRegistry, Counter, Histogram, register } from 'prom-client';
import { getCache } from '../../cache.js';
import { hasDatabaseConnection } from '../../database/index.js';
import { useLogger } from '../../logger/index.js';
import { redisConfigAvailable, useRedis } from '../../redis/index.js';
import { getStorage } from '../../storage/index.js';
import type { MetricService } from '../types/metric.js';

const isPM2 = 'PM2_HOME' in process.env;
const METRICS_SYNC_PACKET = 'directus:metrics---data-sync';

const listApps = promisify(pm2.list.bind(pm2));
const sendDataToProcessId = promisify<number, object>(pm2.sendDataToProcessId.bind(pm2));

export function createMetrics() {
	const env = useEnv();
	const logger = useLogger();

	const services: MetricService[] = (env['METRICS_SERVICES'] as MetricService[] | undefined) ?? [];
	const metricNamePrefix = env['METRICS_NAME_PREFIX'] ?? 'directus_';
	const aggregates = new Map();

	/**
	 * Listen for PM2 metric data sync messages and add them to the aggregate
	 */
	if (isPM2) {
		process.on('message', (packet: any) => {
			if (!packet.data || packet.topic !== METRICS_SYNC_PACKET) return;

			aggregate(packet.data);
		});
	}

	async function generate() {
		const checkId = randomUUID();

		await Promise.all([
			trackDatabaseMetric(),
			trackCacheMetric(checkId),
			trackRedisMetric(checkId),
			trackStorageMetric(checkId),
		]);

		/**
		 * Push generated metrics to all pm2 instances
		 */
		if (isPM2) {
			try {
				const apps = await listApps();

				const data = await register.getMetricsAsJSON();

				const syncs = [];

				for (const app of apps) {
					if (app.pm_id === undefined || app.pid === 0 || app.name !== 'directus') {
						continue;
					}

					syncs.push(
						sendDataToProcessId(app.pm_id, {
							data: { pid: process.pid, metrics: data },
							topic: METRICS_SYNC_PACKET,
						}),
					);
				}

				await Promise.allSettled(syncs);
			} catch (error) {
				logger.error(error);
			}
		}
	}

	/**
	 * Add PM2 synced metric to the aggregate store.
	 * Subsequent syncs for the given instance will override previous value.
	 */
	async function aggregate(data: { pid: number; metrics: MetricObjectWithValues<MetricValue<string>>[] }) {
		aggregates.set(data.pid, data.metrics);
	}

	async function readAll(): Promise<string> {
		/**
		 * In a PM2 context we must aggregate the metrics across instances ensuring
		 * only currently active instances are added to the aggregate
		 */
		if (isPM2 && aggregates.size !== 0) {
			const apps = await listApps();

			const aggregate = [];

			for (const app of apps) {
				if (aggregates.has(app.pid)) {
					aggregate.push(aggregates.get(app.pid));
				}
			}

			if (aggregate.length !== 0) {
				return AggregatorRegistry.aggregate(aggregate).metrics();
			}
		}

		return register.metrics();
	}

	function getDatabaseErrorMetric(): Counter | null {
		if (services.includes('database') === false) {
			return null;
		}

		const client = env['DB_CLIENT'];

		let metric = register.getSingleMetric(`${metricNamePrefix}db_${client}_connection_errors`) as Counter | undefined;

		if (!metric) {
			metric = new Counter({
				name: `${metricNamePrefix}db_${client}_connection_errors`,
				help: `${client} Database connection error count`,
			});
		}

		return metric;
	}

	function getDatabaseResponseMetric(): Histogram | null {
		if (services.includes('database') === false) {
			return null;
		}

		const client = env['DB_CLIENT'];

		let metric = register.getSingleMetric(`${metricNamePrefix}db_${client}_response_time_ms`) as Histogram | undefined;

		if (!metric) {
			metric = new Histogram({
				name: `${metricNamePrefix}db_${client}_response_time_ms`,
				help: `${client} Database connection response time`,
				buckets: [1, 10, 20, 40, 60, 80, 100, 200, 500, 750, 1000],
			});
		}

		return metric;
	}

	function getCacheErrorMetric(): Counter | null {
		if (services.includes('cache') === false || env['CACHE_ENABLED'] !== true) {
			return null;
		}

		if (env['CACHE_STORE'] === 'redis' && redisConfigAvailable() !== true) {
			return null;
		}

		let metric = register.getSingleMetric(`${metricNamePrefix}cache_${env['CACHE_STORE']}_connection_errors`) as
			| Counter
			| undefined;

		if (!metric) {
			metric = new Counter({
				name: `${metricNamePrefix}cache_${env['CACHE_STORE']}_connection_errors`,
				help: 'Cache connection error count',
			});
		}

		return metric;
	}

	function getRedisErrorMetric(): Counter | null {
		if (services.includes('redis') === false || redisConfigAvailable() !== true) {
			return null;
		}

		let metric = register.getSingleMetric(`${metricNamePrefix}redis_connection_errors`) as Counter | undefined;

		if (!metric) {
			metric = new Counter({
				name: `${metricNamePrefix}redis_connection_errors`,
				help: 'Redis connection error count',
			});
		}

		return metric;
	}

	function getStorageErrorMetric(location: string): Counter | null {
		if (services.includes('storage') === false) {
			return null;
		}

		let metric = register.getSingleMetric(`${metricNamePrefix}storage_${location}_connection_errors`) as
			| Counter
			| undefined;

		if (!metric) {
			metric = new Counter({
				name: `${metricNamePrefix}storage_${location}_connection_errors`,
				help: `${location} storage connection error count`,
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
			await cache.set(`directus-metric-${checkId}`, '1', 5);
			await cache.delete(`directus-metric-${checkId}`);
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
			await redis.set(`directus-metric-${checkId}`, '1');
			await redis.del(`directus-metric-${checkId}`);
		} catch {
			metric.inc();
		}
	}

	async function trackStorageMetric(checkId: string) {
		if (services.includes('storage') === false) {
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
				await disk.write('directus-metric-file', Readable.from([checkId]));
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
		aggregate,
		generate,
		readAll,
	};
}
