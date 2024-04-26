import { useEnv } from '@directus/env';
import { version } from 'directus/version';
import { getDatabase, getDatabaseClient } from '../../database/index.js';
import type { TelemetryReport } from '../types/report.js';
import { getItemCount } from '../utils/get-item-count.js';
import { getUserCount } from '../utils/get-user-count.js';
import { getUserItemCount } from '../utils/get-user-item-count.js';

const basicCountTasks = [
	{ collection: 'directus_dashboards' },
	{
		collection: 'directus_extensions',
		where: ['enabled', '=', true],
	},
	{ collection: 'directus_files' },
	{
		collection: 'directus_flows',
		where: ['status', '=', 'active'],
	},
	{ collection: 'directus_roles' },
	{ collection: 'directus_shares' },
] as const;

/**
 * Create a telemetry report about the anonymous usage of the current installation
 */
export const getReport = async (): Promise<TelemetryReport> => {
	const db = getDatabase();
	const env = useEnv();

	const [basicCounts, userCounts, userItemCount] = await Promise.all([
		getItemCount(db, basicCountTasks),
		getUserCount(db),
		getUserItemCount(db),
	]);

	return {
		url: env['PUBLIC_URL'] as string,
		version: version,
		database: getDatabaseClient(),

		dashboards: basicCounts.directus_dashboards,
		extensions: basicCounts.directus_extensions,
		files: basicCounts.directus_files,
		flows: basicCounts.directus_flows,
		roles: basicCounts.directus_roles,
		shares: basicCounts.directus_shares,

		admin_users: userCounts.admin,
		app_users: userCounts.app,
		api_users: userCounts.api,

		collections: userItemCount.collections,
		items: userItemCount.items,
	};
};
