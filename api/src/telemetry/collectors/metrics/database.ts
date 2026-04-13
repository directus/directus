import type { Knex } from 'knex';
import { getHelpers } from '../../../database/helpers/index.js';
import type { TelemetryReport } from '../../types/report.js';

type DatabaseMetrics = TelemetryReport['metrics']['database'];

export async function collectDatabaseMetrics(db: Knex): Promise<DatabaseMetrics> {
	const helpers = getHelpers(db);

	return {
		size: await helpers.schema.getDatabaseSize(),
	};
}
