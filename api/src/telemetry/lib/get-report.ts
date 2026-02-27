import { useEnv } from '@directus/env';
import { toBoolean } from '@directus/utils';
import { version } from 'directus/version';
import { getHelpers } from '../../database/helpers/index.js';
import { getDatabase, getDatabaseClient } from '../../database/index.js';
import { fetchUserCount } from '../../utils/fetch-user-count/fetch-user-count.js';
import { useBufferedCounter } from '../counter/use-buffered-counter.js';
import type { TelemetryReport } from '../types/report.js';
import { TRACKED_KEYS } from '../utils/format-api-request-counts.js';
import { formatApiRequestCounts } from '../utils/format-api-request-counts.js';
import { getExtensionCount } from '../utils/get-extension-count.js';
import { getFieldCount } from '../utils/get-field-count.js';
import { getFilesizeSum } from '../utils/get-filesize-sum.js';
import { getItemCount } from '../utils/get-item-count.js';
import { getSettings } from '../utils/get-settings.js';
import { getUserItemCount } from '../utils/get-user-item-count.js';

const basicCountTasks = [
	{ collection: 'directus_dashboards' },
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
	const requestCounter = useBufferedCounter('api-requests');
	const helpers = getHelpers(db);

	const [
		basicCounts,
		userCounts,
		userItemCount,
		fieldsCounts,
		extensionsCounts,
		databaseSize,
		filesizes,
		settings,
		requestCounts,
	] = await Promise.all([
		getItemCount(db, basicCountTasks),
		fetchUserCount({ knex: db }),
		getUserItemCount(db),
		getFieldCount(db),
		getExtensionCount(db),
		helpers.schema.getDatabaseSize(),
		getFilesizeSum(db),
		getSettings(db),
		requestCounter.getAndResetAll([...TRACKED_KEYS]),
	]);

	return {
		url: env['PUBLIC_URL'] as string,
		version: version,
		database: getDatabaseClient(),

		dashboards: basicCounts.directus_dashboards,
		files: basicCounts.directus_files,
		flows: basicCounts.directus_flows,
		roles: basicCounts.directus_roles,
		shares: basicCounts.directus_shares,

		admin_users: userCounts.admin,
		app_users: userCounts.app,
		api_users: userCounts.api,

		collections: userItemCount.collections,
		items: userItemCount.items,

		fields_max: fieldsCounts.max,
		fields_total: fieldsCounts.total,

		extensions: extensionsCounts.totalEnabled,

		database_size: databaseSize ?? 0,
		files_size_total: filesizes.total,

		websockets_enabled: toBoolean(env['WEBSOCKETS_ENABLED'] ?? false),

		...settings,

		...formatApiRequestCounts(requestCounts),
	};
};
