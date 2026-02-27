import type { SchemaOverview } from '@directus/types';
import type { Knex } from 'knex';
import { DashboardsService } from '../../../services/dashboards.js';
import type { TelemetryReport } from '../../types/report.js';
import { distributionFromCounts, emptyDistribution } from '../../utils/stats.js';

type DashboardMetrics = TelemetryReport['metrics']['dashboards'];

/**
 * Collect dashboard metrics using the native DashboardsService with relational
 * count fields instead of raw Knex GROUP BY queries.
 */
export async function collectDashboardMetrics(db: Knex, schema: SchemaOverview): Promise<DashboardMetrics> {
	const dashboardsService = new DashboardsService({ knex: db, schema });

	const dashboards = (await dashboardsService.readByQuery({
		fields: ['count(panels)'],
		limit: -1,
	})) as Array<{ panels_count: string }>;

	const dashboardCount = dashboards.length;

	return {
		count: dashboardCount,
		panels: dashboardCount > 0
			? distributionFromCounts(dashboards.map((d) => Number(d.panels_count ?? 0)))
			: emptyDistribution(),
	};
}
