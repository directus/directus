import type { Knex } from 'knex';
import { getDatabaseClient } from '../../../database/index.js';
import type { TelemetryReport } from '../../types/report.js';
import { getDatabaseVersion } from '../../utils/get-database-version.js';

export async function collectDatabase(db: Knex): Promise<TelemetryReport['config']['database']> {
	const driver = getDatabaseClient();
	return {
		driver,
		version: await getDatabaseVersion(db, driver),
	};
}
