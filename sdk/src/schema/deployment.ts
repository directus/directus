import type { MergeCoreCollection } from '../index.js';
import type { DirectusUser } from './user.js';

/**
 * Directus Deployment configuration
 */
export type DirectusDeployment<Schema = any> = MergeCoreCollection<
	Schema,
	'directus_deployments',
	{
		id: string;
		provider: 'vercel' | 'netlify';
		credentials: '**********' | null;
		options: Record<string, any> | null;
		webhook_ids: string[] | null;
		webhook_secret: string | null;
		last_synced_at: string | null;
		date_created: 'datetime' | null;
		user_created: DirectusUser<Schema> | string | null;
		projects: DirectusDeploymentProject<Schema>[] | string[];
	}
>;

/**
 * Credentials are redacted to `'**********'` on read, so create/update commands
 * override the field to accept the real, provider-specific credentials object.
 */
export type DirectusDeploymentCredentials = Record<string, any>;

/**
 * Directus Deployment Project
 */
export type DirectusDeploymentProject<Schema = any> = MergeCoreCollection<
	Schema,
	'directus_deployment_projects',
	{
		id: string;
		deployment: DirectusDeployment<Schema> | string;
		external_id: string;
		name: string;
		url: string | null;
		framework: string | null;
		deployable: boolean;
		date_created: 'datetime' | null;
		user_created: DirectusUser<Schema> | string | null;
	}
>;

/**
 * Directus Deployment Run
 */
export type DirectusDeploymentRun<Schema = any> = MergeCoreCollection<
	Schema,
	'directus_deployment_runs',
	{
		id: string;
		project: DirectusDeploymentProject<Schema> | string;
		external_id: string;
		status: 'building' | 'ready' | 'error' | 'canceled' | null;
		target: string;
		url: string | null;
		started_at: 'datetime' | null;
		completed_at: 'datetime' | null;
		date_created: 'datetime' | null;
		user_created: DirectusUser<Schema> | string | null;
		logs?: { timestamp: Date | string; type: 'stdout' | 'stderr' | 'info'; message: string }[];
	}
>;
