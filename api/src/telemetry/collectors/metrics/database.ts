import type { Knex } from 'knex';
import type { TelemetryReport } from '../../types/report.js';
import { getHelpers } from '../../../database/helpers/index.js';

type DatabaseMetrics = TelemetryReport['metrics']['database'];

export async function collectDatabaseMetrics(db: Knex): Promise<DatabaseMetrics> {
	const helpers = getHelpers(db);

	return {
		size: await helpers.schema.getDatabaseSize(),
	};
}
