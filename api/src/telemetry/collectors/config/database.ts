import type { Knex } from 'knex';
import { getDatabaseClient } from '../../../database/index.js';
import { getHelpers } from '../../../database/helpers/index.js';
import type { TelemetryReport } from '../../types/report.js';

export async function collectDatabase(db: Knex): Promise<TelemetryReport['config']['database']> {
	const driver = getDatabaseClient();
	const helpers = getHelpers(db);

	return {
		driver,
		version: await helpers.schema.getVersion(),
	};
}
