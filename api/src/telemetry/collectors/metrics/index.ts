import type { SchemaOverview } from '@directus/types';
import type { Knex } from 'knex';
import type { TelemetryReport } from '../../types/report.js';
import { safeCollect } from '../../utils/safe-collect.js';
import { serviceCount } from '../../utils/service-count.js';
import { collectCollectionMetrics } from './collections.js';
import { collectDashboardMetrics } from './dashboards.js';
import { collectDatabaseMetrics } from './database.js';
import { collectDeploymentMetrics } from './deployments.js';
import { collectExtensionMetrics } from './extensions.js';
import { collectFileMetrics } from './files.js';
import { collectFlowMetrics } from './flows.js';
import { collectOAuthClientMetrics } from './oauth-clients.js';
import { collectOperationMetrics } from './operations.js';
import { collectPresetMetrics } from './presets.js';
import { collectRoleMetrics } from './roles.js';
import { collectTranslationMetrics } from './translations.js';
import { collectUserMetrics } from './users.js';

type Metrics = Omit<TelemetryReport['metrics'], 'api_requests'>;

export async function collectMetrics(db: Knex, schema: SchemaOverview): Promise<Metrics> {
	const [
		collectionMetrics,
		fileMetrics,
		flowMetrics,
		roleMetrics,
		translationMetrics,
		userMetrics,
		dashboardMetrics,
		extensionMetrics,
		operationMetrics,
		presetMetrics,
		deploymentMetrics,
		oauthClientMetrics,
		relations,
		permissions,
		folders,
		comments,
		versions,
		shares,
		fields,
		panels,
		policies,
		databaseMetrics,
	] = await Promise.all([
		safeCollect('metrics.collections', () => collectCollectionMetrics(db, schema)),
		safeCollect('metrics.files', () => collectFileMetrics(db, schema)),
		safeCollect('metrics.flows', () => collectFlowMetrics(db, schema)),
		safeCollect('metrics.roles', () => collectRoleMetrics(db, schema)),
		safeCollect('metrics.translations', () => collectTranslationMetrics(db, schema)),
		safeCollect('metrics.users', () => collectUserMetrics(db)),
		safeCollect('metrics.dashboards', () => collectDashboardMetrics(db, schema)),
		safeCollect('metrics.extensions', () => collectExtensionMetrics(db, schema)),
		safeCollect('metrics.operations', () => collectOperationMetrics(db, schema)),
		safeCollect('metrics.presets', () => collectPresetMetrics(db, schema)),
		safeCollect('metrics.deployments', () => collectDeploymentMetrics(db, schema)),
		safeCollect('metrics.oauth_clients', () => collectOAuthClientMetrics(db, schema)),
		safeCollect('metrics.relations', async () => ({ count: await serviceCount(db, schema, 'directus_relations') })),
		safeCollect('metrics.permissions', async () => ({ count: await serviceCount(db, schema, 'directus_permissions') })),
		safeCollect('metrics.folders', async () => ({ count: await serviceCount(db, schema, 'directus_folders') })),
		safeCollect('metrics.comments', async () => ({ count: await serviceCount(db, schema, 'directus_comments') })),
		safeCollect('metrics.versions', async () => ({ count: await serviceCount(db, schema, 'directus_versions') })),
		safeCollect('metrics.shares', async () => ({ count: await serviceCount(db, schema, 'directus_shares') })),
		safeCollect('metrics.fields', async () => ({ count: await serviceCount(db, schema, 'directus_fields') })),
		safeCollect('metrics.panels', async () => ({ count: await serviceCount(db, schema, 'directus_panels') })),
		safeCollect('metrics.policies', async () => ({ count: await serviceCount(db, schema, 'directus_policies') })),
		safeCollect('metrics.database', () => collectDatabaseMetrics(db)),
	]);

	let collections: Metrics['collections'] = null;
	let items: Metrics['items'] = null;

	if (collectionMetrics) {
		const { _totalItems, _totalFields, ...rest } = collectionMetrics;
		collections = rest;
		items = { count: _totalItems };
	}

	return {
		collections,
		shares,
		items,
		files: fileMetrics,
		users: userMetrics,
		roles: roleMetrics,
		policies,
		fields,
		flows: flowMetrics,
		operations: operationMetrics,
		relations,
		permissions,
		folders,
		comments,
		versions,
		presets: presetMetrics,
		deployments: deploymentMetrics,
		oauth_clients: oauthClientMetrics,
		translations: translationMetrics,
		dashboards: dashboardMetrics,
		panels,
		extensions: extensionMetrics,
		database: databaseMetrics,
	};
}
