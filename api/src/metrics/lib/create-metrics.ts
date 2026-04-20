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

function getOrCreateCounter(name: string, help: string): Counter {
	return (register.getSingleMetric(name) as Counter | undefined) ?? new Counter({ name, help });
}

function getOrCreateHistogram(name: string, help: string, buckets: number[]): Histogram {
	return (register.getSingleMetric(name) as Histogram | undefined) ?? new Histogram({ name, help, buckets });
}

const metricCheckKey = (checkId: string) => `directus-metric-${checkId}`;

export function createMetrics() {
	const env = useEnv();
	const logger = useLogger();

	const services: MetricService[] = (env['METRICS_SERVICES'] as MetricService[] | undefined) ?? [];
	const metricNamePrefix = env['METRICS_NAME_PREFIX'] ?? 'directus_';
	const aggregates = new Map();

	if (isPM2) {
		process.on('message', (packet: any) => {
			if (!packet.data || packet.topic !== METRICS_SYNC_PACKET) return;
			aggregate(packet.data);
		});
	}

	async function syncMetricsToPM2Instances(data: MetricObjectWithValues<MetricValue<string>>[]) {
		const apps = await listApps();

		const syncs = apps
			.filter((app) => app.pm_id !== undefined && app.pid !== 0 && app.name === 'directus')
			.map((app) =>
				sendDataToProcessId(app.pm_id!, {
					data: { pid: process.pid, metrics: data },
					topic: METRICS_SYNC_PACKET,
				}),
			);

		await Promise.allSettled(syncs);
	}

	async function aggregateActivePM2Metrics() {
		const apps = await listApps();
		const activeMetrics = apps.filter((app) => aggregates.has(app.pid)).map((app) => aggregates.get(app.pid));
		if (activeMetrics.length === 0) return null;
		return AggregatorRegistry.aggregate(activeMetrics).metrics();
	}

	async function generate() {
		await Promise.all([
			trackDatabaseMetric(),
			trackCacheMetric(randomUUID()),
			trackRedisMetric(randomUUID()),
			trackStorageMetric(randomUUID()),
		]);

		if (!isPM2) return;

		try {
			await syncMetricsToPM2Instances(await register.getMetricsAsJSON());
		} catch (error) {
			logger.error(error);
		}
	}

	async function aggregate(data: { pid: number; metrics: MetricObjectWithValues<MetricValue<string>>[] }) {
		aggregates.set(data.pid, data.metrics);
	}

	async function readAll(): Promise<string> {
		if (isPM2 && aggregates.size !== 0) {
			const result = await aggregateActivePM2Metrics();
			if (result) return result;
		}

		return register.metrics();
	}

	function getDatabaseErrorMetric(): Counter | null {
		if (!services.includes('database')) return null;
		const client = env['DB_CLIENT'];
		return getOrCreateCounter(`${metricNamePrefix}db_${client}_connection_errors`, `${client} Database connection error count`);
	}

	function getDatabaseResponseMetric(): Histogram | null {
		if (!services.includes('database')) return null;
		const client = env['DB_CLIENT'];

		return getOrCreateHistogram(
			`${metricNamePrefix}db_${client}_response_time_ms`,
			`${client} Database connection response time`,
			[1, 10, 20, 40, 60, 80, 100, 200, 500, 750, 1000],
		);
	}

	function getCacheErrorMetric(): Counter | null {
		if (!services.includes('cache') || env['CACHE_ENABLED'] !== true) return null;
		if (env['CACHE_STORE'] === 'redis' && !redisConfigAvailable()) return null;

		return getOrCreateCounter(
			`${metricNamePrefix}cache_${env['CACHE_STORE']}_connection_errors`,
			'Cache connection error count',
		);
	}

	function getRedisErrorMetric(): Counter | null {
		if (!services.includes('redis') || !redisConfigAvailable()) return null;
		return getOrCreateCounter(`${metricNamePrefix}redis_connection_errors`, 'Redis connection error count');
	}

	function getStorageErrorMetric(location: string): Counter | null {
		if (!services.includes('storage')) return null;
		return getOrCreateCounter(`${metricNamePrefix}storage_${location}_connection_errors`, `${location} storage connection error count`);
	}

	async function trackDatabaseMetric(): Promise<void> {
		const metric = getDatabaseErrorMetric();
		if (!metric) return;

		try {
			if (!await hasDatabaseConnection()) metric.inc();
		} catch {
			metric.inc();
		}
	}

	async function trackCacheMetric(checkId: string): Promise<void> {
		const metric = getCacheErrorMetric();
		if (!metric) return;

		const { cache } = getCache();
		if (!cache) return;

		try {
			await cache.set(metricCheckKey(checkId), '1', 5);
			await cache.delete(metricCheckKey(checkId));
		} catch {
			metric.inc();
		}
	}

	async function trackRedisMetric(checkId: string) {
		const metric = getRedisErrorMetric();
		if (!metric) return;

		const redis = useRedis();

		try {
			await redis.set(metricCheckKey(checkId), '1');
			await redis.del(metricCheckKey(checkId));
		} catch {
			metric.inc();
		}
	}

	async function trackStorageMetric(checkId: string) {
		if (!services.includes('storage')) return;

		const storage = await getStorage();

		for (const location of toArray(env['STORAGE_LOCATIONS'] as string)) {
			const metric = getStorageErrorMetric(location);
			if (!metric) continue;

			try {
				await storage.location(location).write('directus-metric-file', Readable.from([checkId]));
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
