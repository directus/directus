import { getCache } from '../../cache.js';
import { useEnv } from '../../env.js';
import { scheduleSynchronizedJob } from '../../utils/schedule.js';
import { track } from './track.js';

/**
 * Initialize the telemetry tracking. Will generate a report on start, and set a schedule to report
 * every 6 hours
 */
export const initTelemetry = async () => {
	const env = useEnv();
	const { lockCache } = getCache();

	if (env['TELEMETRY'] === false) return;

	if (!(await lockCache.get('telemetry-lock'))) {
		await lockCache.set('telemetry-lock', true, 30000);

		track({ wait: false });

		// Don't flush the lock. We want to debounce these calls in the 30s window we're setting
		// when the first container starts the track on startup
	}

	scheduleSynchronizedJob('telemetry', '0 */6 * * *', () => track());
};
