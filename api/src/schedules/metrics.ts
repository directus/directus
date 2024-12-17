import { useEnv } from '@directus/env';
import { toBoolean } from '@directus/utils';
import { useLock } from '../lock/index.js';
import { useMetrics } from '../metrics/index.js';
import { scheduleSynchronizedJob, validateCron } from '../utils/schedule.js';

const env = useEnv();
const metrics = useMetrics();
const metricsLockKey = 'schedule--metrics';
const metricsLockTimeout = 10 * 60 * 1000; // 10 mins

export async function handleMetricsJob() {
	const lock = useLock();
	const lockTime = await lock.get(metricsLockKey);
	const now = Date.now();

	if (lockTime && Number(lockTime) > now - metricsLockTimeout) {
		// ensure only one connected process
		return;
	}

	await lock.set(metricsLockKey, Date.now());

	await metrics.generate();

	await lock.delete(metricsLockKey);
}

/**
 * Schedule the metric generation
 *
 * @returns Whether or not metrics has been initialized
 */
export default async function schedule(): Promise<boolean> {
	if (!toBoolean(env['METRICS_ENABLED'])) {
		return false;
	}

	if (!validateCron(String(env['METRICS_SCHEDULE']))) {
		return false;
	}

	scheduleSynchronizedJob('metrics', String(env['METRICS_SCHEDULE']), handleMetricsJob);

	return true;
}
