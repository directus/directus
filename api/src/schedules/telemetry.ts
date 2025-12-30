import { getCache } from '../cache.js';
import { track } from '../telemetry/index.js';
import { scheduleSynchronizedJob } from '../utils/schedule.js';
import { useEnv } from '@directus/env';
import { toBoolean } from '@directus/utils';

/**
 * Exported to be able to test the anonymous callback function
 */
export const jobCallback = () => {
	track();
};

/**
 * Schedule the telemetry tracking. Will generate a report on start, and set a schedule to report
 * every 6 hours
 *
 * @returns Whether or not telemetry has been initialized
 */
export default async function schedule(): Promise<boolean> {
	const env = useEnv();

	if (toBoolean(env['TELEMETRY']) === false) return false;

	scheduleSynchronizedJob('telemetry', '0 */6 * * *', jobCallback);

	const { lockCache } = getCache();

	if (!(await lockCache.get('telemetry-lock'))) {
		await lockCache.set('telemetry-lock', true, 30000);

		track({ wait: false });

		// Don't flush the lock. We want to debounce these calls across containers on startup
	}

	return true;
}
