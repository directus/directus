import type { SchemaOverview } from '@directus/types';
import type { Knex } from 'knex';
import type { TelemetryReport } from '../../types/report.js';
import { serviceCount } from '../../utils/service-count.js';
import { collectApiRequestMetrics } from './api-requests.js';
import { collectCollectionMetrics } from './collections.js';
import { collectDashboardMetrics } from './dashboards.js';
import { collectExtensionMetrics } from './extensions.js';
import { collectFileMetrics } from './files.js';
import { collectFlowMetrics } from './flows.js';
import { collectRoleMetrics } from './roles.js';
import { collectTranslationMetrics } from './translations.js';
import { collectUserMetrics } from './users.js';

type Metrics = TelemetryReport['metrics'];

export async function collectMetrics(db: Knex, schema: SchemaOverview): Promise<Metrics> {
	const [
		apiRequests,
		collectionMetrics,
		fileMetrics,
		flowMetrics,
		roleMetrics,
		translationMetrics,
		userMetrics,
		dashboardMetrics,
		extensionMetrics,
		sharesCount,
		fieldsCount,
		panelsCount,
		policiesCount,
	] = await Promise.all([
		collectApiRequestMetrics(),
		collectCollectionMetrics(db, schema),
		collectFileMetrics(db, schema),
		collectFlowMetrics(db, schema),
		collectRoleMetrics(db, schema),
		collectTranslationMetrics(db, schema),
		collectUserMetrics(db),
		collectDashboardMetrics(db, schema),
		collectExtensionMetrics(db, schema),
		serviceCount(db, schema, 'directus_shares'),
		serviceCount(db, schema, 'directus_fields'),
		serviceCount(db, schema, 'directus_panels'),
		serviceCount(db, schema, 'directus_policies'),
	]);

	const { _totalItems, _totalFields, ...collections } = collectionMetrics;

	return {
		api_requests: apiRequests,
		collections,
		shares: { count: sharesCount },
		items: { count: _totalItems },
		files: fileMetrics,
		users: userMetrics,
		roles: roleMetrics,
		policies: { count: policiesCount },
		fields: { count: fieldsCount },
		flows: flowMetrics,
		translations: translationMetrics,
		dashboards: dashboardMetrics,
		panels: { count: panelsCount },
		extensions: extensionMetrics,
	};
}
