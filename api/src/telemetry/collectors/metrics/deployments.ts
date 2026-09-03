import type { SchemaOverview } from '@directus/types';
import { DEPLOYMENT_PROVIDER_TYPES } from '@directus/types';
import type { Knex } from 'knex';
import type { DeploymentMetrics } from '../../types/report.js';
import { countByColumn } from '../../utils/count-by-column.js';
import { serviceCount } from '../../utils/service-count.js';

export async function collectDeploymentMetrics(db: Knex, schema: SchemaOverview): Promise<DeploymentMetrics> {
	const [count, provider, projects, runs] = await Promise.all([
		serviceCount(db, schema, 'directus_deployments'),
		countByColumn(db, 'directus_deployments', 'provider', DEPLOYMENT_PROVIDER_TYPES),
		serviceCount(db, schema, 'directus_deployment_projects'),
		serviceCount(db, schema, 'directus_deployment_runs'),
	]);

	return { count, provider, projects: { count: projects }, runs: { count: runs } };
}
