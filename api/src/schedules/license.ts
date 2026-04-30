import { getLicense, getLicenseManager } from '../license/manager.js';
import { scheduleSynchronizedJob, validateCron } from '../utils/schedule.js';
import { durationToCron } from './utils/duration-to-cron.js';

/**
 * Schedule a license check in a given license based validation interval
 */
export default async function schedule(): Promise<boolean> {
	const licenseManager = getLicenseManager();
	const license = await getLicense();

	// -1 = no verification required
	if (license.meta.validation_interval === -1) return false;

	const schedule = durationToCron(license.meta.validation_interval);

	if (!validateCron(schedule)) return false;

	scheduleSynchronizedJob('license-check', schedule, async () => {
		await licenseManager.refresh();
	});

	return true;
}
