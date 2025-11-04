import { random } from 'lodash-es';
import getDatabase from '../database/index.js';
import { sendReport } from '../telemetry/index.js';
import { scheduleSynchronizedJob } from '../utils/schedule.js';
import { version } from 'directus/version';

/**
 * Schedule the project status job
 */
export default async function schedule() {
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
}
