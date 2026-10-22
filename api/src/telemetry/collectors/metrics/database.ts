import type { Knex } from 'knex';
import { getHelpers } from '../../../database/helpers/index.js';
import type { DatabaseMetrics } from '../../types/report.js';

export async function collectDatabaseMetrics(db: Knex): Promise<DatabaseMetrics> {
	const helpers = getHelpers(db);

	return {
		size: await helpers.schema.getDatabaseSize(),
	};
}
