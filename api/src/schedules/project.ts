import { useEnv } from '@directus/env';
import { toBoolean } from '@directus/utils';
import { version } from 'directus/version';
import { random } from 'lodash-es';
import getDatabase from '../database/index.js';
import { sendReport } from '../telemetry/index.js';
import { scheduleSynchronizedJob } from '../utils/schedule.js';

/**
 * Schedule the project status job
 *
 * @returns Whether or not the project status job has been initialized
 */
export default async function schedule(): Promise<boolean> {
	const env = useEnv();

	if (toBoolean(env['PROJECT_OWNER_ENABLED']) === false) {
		return false;
	}

	const db = getDatabase();

	// Schedules a job at a random time of the day to avoid overloading the telemetry server
	scheduleSynchronizedJob('project-status', `${random(59)} ${random(23)} * * *`, async () => {
		const { project_status, ...ownerInfo } = await db
			.select('project_status', 'project_owner', 'project_usage', 'org_name', 'product_updates', 'project_id')
			.from('directus_settings')
			.first();

		if (project_status !== 'pending') return;

		try {
			await sendReport({ version, ...ownerInfo });
			await db.update('project_status', '').from('directus_settings');
		} catch {
			// Empty catch
		}
	});

	return true;
}
