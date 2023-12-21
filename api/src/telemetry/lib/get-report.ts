import { version } from 'directus/version';
import { getDatabase, getDatabaseClient } from '../../database/index.js';
import { useEnv } from '../../env.js';
import type { TelemetryReport } from '../types/report.js';
import { getItemCount } from '../utils/get-item-count.js';
import { getUserCount } from '../utils/get-user-count.js';
import { getUserItemCount } from '../utils/get-user-item-count.js';

const basicCountCollections = [
	'directus_dashboards',
	'directus_extensions',
	'directus_files',
	'directus_flows',
	'directus_roles',
	'directus_shares',
] as const;

/**
 * Create a telemetry report about the anonymous usage of the current installation
 */
export const getReport = async (): Promise<TelemetryReport> => {
	const db = getDatabase();
	const env = useEnv();

	const [basicCounts, userCounts, userItemCount] = await Promise.all([
		getItemCount(db, basicCountCollections),
		getUserCount(db),
		getUserItemCount(db),
	]);

	return {
		url: env['PUBLIC_URL'],
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
