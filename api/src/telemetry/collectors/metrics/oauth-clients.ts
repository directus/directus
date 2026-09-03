import type { SchemaOverview } from '@directus/types';
import type { Knex } from 'knex';
import type { OAuthClientMetrics } from '../../types/report.js';
import { countByColumn } from '../../utils/count-by-column.js';
import { serviceCount } from '../../utils/service-count.js';

/** How an MCP OAuth client was registered: dynamic client registration, or client ID metadata document. */
const REGISTRATION_TYPES = ['dcr', 'cimd'] as const;

export async function collectOAuthClientMetrics(db: Knex, schema: SchemaOverview): Promise<OAuthClientMetrics> {
	const [count, registration] = await Promise.all([
		serviceCount(db, schema, 'directus_oauth_clients'),
		countByColumn(db, 'directus_oauth_clients', 'registration_type', REGISTRATION_TYPES),
	]);

	return { count, registration };
}
