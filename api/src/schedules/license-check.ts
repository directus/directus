import { useEnv } from '@directus/env';
import { random } from 'lodash-es';
import { refreshLicense } from '../license/lifecycle.js';
import { useLogger } from '../logger/index.js';
import { scheduleSynchronizedJob, validateCron } from '../utils/schedule.js';

const env = useEnv();
const logger = useLogger();

export async function handleLicenseCheckJob() {
	try {
		await refreshLicense();
	} catch (error) {
		logger.warn(error, '[license] Scheduled license validation failed');
	}
}

export default async function schedule(): Promise<boolean> {
	const cronTime = env['LICENSE_VALIDATE_SCHEDULE']
		? String(env['LICENSE_VALIDATE_SCHEDULE'])
		: `${random(59)} ${random(59)} */6 * * *`;

	if (!validateCron(cronTime)) {
		return false;
	}

	scheduleSynchronizedJob('license-check', cronTime, handleLicenseCheckJob);
	return true;
}
