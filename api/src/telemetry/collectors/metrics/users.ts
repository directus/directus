import type { Knex } from 'knex';
import { fetchUserCount } from '../../../utils/fetch-user-count/fetch-user-count.js';
import type { TelemetryReport } from '../../types/report.js';

type UserMetrics = TelemetryReport['metrics']['users'];

export async function collectUserMetrics(db: Knex): Promise<UserMetrics> {
	const counts = await fetchUserCount({ knex: db });
	return {
		admin: { count: counts.admin },
		app: { count: counts.app },
		api: { count: counts.api },
	};
}
