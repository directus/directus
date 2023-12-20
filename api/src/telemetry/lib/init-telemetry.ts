import { getCache } from '../../cache.js';
import { useEnv } from '../../env.js';
import { scheduleSynchronizedJob } from '../../utils/schedule.js';
import { track } from './track.js';

export const jobCallback = () => track();

/**
 * Initialize the telemetry tracking. Will generate a report on start, and set a schedule to report
 * every 6 hours
 *
 * @returns Whether or not telemetry has been initialized
 */
export const initTelemetry = async () => {
	const env = useEnv();

	if (env['TELEMETRY'] === false) return false;

	scheduleSynchronizedJob('telemetry', '0 */6 * * *', jobCallback);

	const { lockCache } = getCache();

	if (!(await lockCache.get('telemetry-lock'))) {
		await lockCache.set('telemetry-lock', true, 30000);

		track({ wait: false });

		// Don't flush the lock. We want to debounce these calls across containers on startup
	}

	return true;
};
