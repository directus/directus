import getDatabase from '../database/index.js';
import { sendOwnerReport } from '../telemetry/lib/send-owner-report.js';
import { scheduleSynchronizedJob } from '../utils/schedule.js';

/**
 * Schedule the project status job
 */
export default async function schedule() {
	const db = getDatabase();

	scheduleSynchronizedJob('project-status', '0 * * * *', async () => {
		const { project_status, ...ownerInfo } = await db
			.select('project_status', 'project_owner', 'project_usage', 'org_name', 'product_updates', 'project_id')
			.from('directus_settings')
			.first();

		if (project_status !== 'pending') return;

		try {
			await sendOwnerReport(ownerInfo);
			await db.update('project_status', '').from('directus_settings');
		} catch (_error) {
			// Empty catch
		}
	});
}
