import { useEnv } from '@directus/env';
import { toBoolean } from '@directus/utils';
import { CronJob } from 'cron';
import { useLogger } from '../logger/index.js';
import { useMetrics } from '../metrics/index.js';
import { validateCron } from '../utils/schedule.js';

const METRICS_LOCK_TIMEOUT = 10 * 60 * 1000; // 10 mins

let lockedAt = 0;
const logger = useLogger();
const metrics = useMetrics();

export async function handleMetricsJob() {
	const now = Date.now();

	if (lockedAt !== 0 && lockedAt > now - METRICS_LOCK_TIMEOUT) {
		// ensure only generating metrics once per node
		return;
	}

	lockedAt = Date.now();

	try {
		await metrics?.generate();
	} catch (err) {
		logger.warn(`An error was thrown while attempting metric generation`);
		logger.warn(err);
	} finally {
		lockedAt = 0;
	}
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

	CronJob.from({
		cronTime: String(env['METRICS_SCHEDULE']),
		onTick: handleMetricsJob,
		start: true,
	});

	return true;
}
