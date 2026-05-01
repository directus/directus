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

	const cron = durationToCron(license.meta.validation_interval);

	if (!validateCron(cron)) return false;

	const { stop } = scheduleSynchronizedJob('license-check', cron, async () => {
		const jobLicense = await getLicense();

		// If interval has changed from a refresh, reschedule job with new
		if (jobLicense.meta.validation_interval !== license.meta.validation_interval) {
			await stop();

			if (jobLicense.meta.validation_interval !== -1) {
				await schedule();
			}
		} else {
			await licenseManager.refresh();
		}
	});

	return true;
}
