import { setTimeout } from 'timers/promises';
import { getNodeEnv } from '@directus/utils/node';
import { useLogger } from '../../logger/index.js';
import { getRandomWaitTime } from '../utils/get-random-wait-time.js';
import { getReport } from './get-report.js';
import { sendReport } from './send-report.js';

/**
 * Generate and send a report. Will log on error, but not throw. No need to be awaited
 *
 * @param opts Options for the tracking
 * @param opts.wait Whether or not to wait a random amount of time between 0 and 30 minutes
 * @returns whether or not the tracking was successful
 */
export const track = async (opts = { wait: true }) => {
	const logger = useLogger();

	if (opts.wait) {
		await setTimeout(getRandomWaitTime());
	}

	try {
		const report = await getReport();
		await sendReport(report);
		return true;
	} catch (err) {
		if (getNodeEnv() === 'development') {
			logger.error(err);
		}

		return false;
	}
};
