import { getLicenseManager } from '../license/manager.js';
import { type ScheduledJob, scheduleSynchronizedJob, validateCron } from '../utils/schedule.js';
import { durationToCron } from './utils/duration-to-cron.js';

let job: ScheduledJob | null = null;

export async function stopLicenseCheck(): Promise<void> {
	await job?.stop();
}

/**
 * Schedule a license check at the license's validation_interval.
 */
export default async function schedule(): Promise<boolean> {
	await job?.stop();

	const licenseManager = getLicenseManager();
	const license = await licenseManager.getLicense();

	// -1 = no verification required
	if (license.meta.validation_interval === -1) return false;

	const cron = durationToCron(license.meta.validation_interval);

	if (!validateCron(cron)) return false;

	job = scheduleSynchronizedJob('license-check', cron, async () => {
		const jobLicense = await licenseManager.getLicense();

		// If interval has changed since registration then reschedule
		if (jobLicense.meta.validation_interval !== license.meta.validation_interval) {
			await job?.stop();

			if (jobLicense.meta.validation_interval !== -1) {
				await schedule();
			}
		} else {
			await licenseManager.refresh();
		}
	});

	return true;
}
