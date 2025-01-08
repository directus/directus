import { useEnv } from '@directus/env';
import { toBoolean } from '@directus/utils';
import { scheduleJob } from 'node-schedule';
import { useMetrics } from '../metrics/index.js';
import { validateCron } from '../utils/schedule.js';

const METRICS_LOCK_TIMEOUT = 10 * 60 * 1000; // 10 mins
let lockedAt = 0;

const metrics = useMetrics();

export async function handleMetricsJob() {
	const now = Date.now();

	if (lockedAt !== 0 && lockedAt > now - METRICS_LOCK_TIMEOUT) {
		// ensure only generating metrics once per node
		return;
	}

	lockedAt = Date.now();

	await metrics.generate();

	lockedAt = 0;
}

/**
 * Schedule the metric generation
 *
 * @returns Whether or not metrics has been initialized
 */
export default async function schedule(): Promise<boolean> {
	const env = useEnv();

	if (!toBoolean(env['METRICS_ENABLED'])) {
		return false;
	}

	if (!validateCron(String(env['METRICS_SCHEDULE']))) {
		return false;
	}

	scheduleJob('metrics', String(env['METRICS_SCHEDULE']), handleMetricsJob);

	return true;
}
