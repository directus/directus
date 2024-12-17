import { useEnv } from '@directus/env';
import { toArray } from '@directus/utils';
import { randomUUID } from 'node:crypto';
import { Readable } from 'node:stream';
import { getCache } from '../../cache.js';
import { hasDatabaseConnection } from '../../database/index.js';
import { redisConfigAvailable, useRedis } from '../../redis/index.js';
import { getStorage } from '../../storage/index.js';
import type { ServiceMetric } from '../types/metric.js';

export function createMetrics() {
	const metrics = new Map<string, ServiceMetric>();
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

	function readAll() {
		let data = '';

		// convert to prometheus data format
		for (const [_, metric] of metrics) {
			// service is not enabled
			if (metric.value === null) {
				continue;
			}

			if (metric.help) {
				data += `# HELP ${metric.help}\n`;
			}

			data += `# TYPE ${metric.name} ${metric.type}\n`;

			data += `${metric.name} ${metric.value}\n`;
		}

		return data;
	}

	async function getDatabaseMetric(): Promise<void> {
		const client = env['DB_CLIENT'];

		const metric: ServiceMetric = {
			name: `directus_${client}_response_time`,
			value: null,
			type: 'histogram',
		};

		if (env['METRICS_DATABASE_ENABLED'] !== true) {
			return;
		}

		try {
			const startTime = performance.now();

			// if no connection indicate issue via zero value
			if (await hasDatabaseConnection()) {
				const endTime = performance.now();

				metric.value = +(endTime - startTime).toFixed(3);
			} else {
				metric.value = -1;
			}
		} catch {
			metric.value = -1;
		}

		metrics.set(metric.name, metric);
	}

	async function getCacheMetric(checkId: string): Promise<void> {
		const metric: ServiceMetric = {
			name: 'directus_cache_response_time',
			value: null,
			type: 'histogram',
		};

		if (env['CACHE_ENABLED'] !== true || env['METRICS_CACHE_ENABLED'] !== true) {
			return;
		}

		const { cache } = getCache();

		if (!cache) {
			return;
		}

		try {
			const startTime = performance.now();
			await cache.set(`metrics-${checkId}`, '1', 5);
			await cache.delete(`metrics-${checkId}`);
			const endTime = performance.now();
			metric.value = +(endTime - startTime).toFixed(3);
		} catch {
			metric.value = -1;
		}

		metrics.set(metric.name, metric);
	}

	async function getRedisMetric(checkId: string) {
		if (!redisConfigAvailable() || env['METRICS_REDIS_ENABLED'] !== true) {
			return;
		}

		const redis = useRedis();

		const metric: ServiceMetric = {
			name: 'directus_redis_response_time',
			value: null,
			type: 'histogram',
		};

		try {
			const startTime = performance.now();
			await redis.set(`metrics-${checkId}`, '1');
			await redis.del(`metrics-${checkId}`);
			const endTime = performance.now();
			metric.value = +(endTime - startTime).toFixed(3);
		} catch {
			metric.value = -1;
		}

		metrics.set(metric.name, metric);
	}

	async function getStorageMetric(checkId: string) {
		if (env['METRICS_STORAGE_ENABLED'] !== true) {
			return;
		}

		const storage = await getStorage();

		for (const location of toArray(env['STORAGE_LOCATIONS'] as string)) {
			const disk = storage.location(location);

			const metric: ServiceMetric = {
				name: `directus_${location}_response_time`,
				value: null,
				type: 'histogram',
			};

			const startTime = performance.now();

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

				const endTime = performance.now();
				metric.value = +(endTime - startTime).toFixed(3);
			} catch {
				metric.value = -1;
			}

			metrics.set(metric.name, metric);
		}
	}

	return {
		generate,
		readAll,
	};
}
