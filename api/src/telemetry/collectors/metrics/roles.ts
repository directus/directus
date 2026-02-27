import type { SchemaOverview } from '@directus/types';
import type { Knex } from 'knex';
import { RolesService } from '../../../services/roles.js';
import type { TelemetryReport } from '../../types/report.js';
import { distributionFromCounts, emptyDistribution } from '../../utils/stats.js';

type RoleMetrics = TelemetryReport['metrics']['roles'];

/**
 * Collect role metrics using the native Directus RolesService with relational
 * count fields — avoids raw Knex GROUP BY queries in favour of the service
 * query layer which handles joins and permission-safe access.
 */
export async function collectRoleMetrics(db: Knex, schema: SchemaOverview): Promise<RoleMetrics> {
	const rolesService = new RolesService({ knex: db, schema });

	const roles = (await rolesService.readByQuery({
		fields: ['count(users)', 'count(children)', 'count(policies)'],
		limit: -1,
	})) as Array<{ users_count: string; children_count: string; policies_count: string }>;

	const roleCount = roles.length;

	return {
		count: roleCount,
		users: roleCount > 0
			? distributionFromCounts(roles.map((r) => Number(r.users_count ?? 0)))
			: emptyDistribution(),
		policies: roleCount > 0
			? distributionFromCounts(roles.map((r) => Number(r.policies_count ?? 0)))
			: emptyDistribution(),
		roles: roleCount > 0
			? distributionFromCounts(roles.map((r) => Number(r.children_count ?? 0)))
			: emptyDistribution(),
	};
}
