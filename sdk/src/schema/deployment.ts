import type { MergeCoreCollection } from '../index.js';
import type { DirectusUser } from './user.js';

/**
 * Directus Deployment configuration
 */
export type DirectusDeployment<Schema = any> = MergeCoreCollection<
	Schema,
	'directus_deployment',
	{
		id: string;
		provider: string;
		credentials: Record<string, any>;
		options: Record<string, any> | null;
		date_created: 'datetime' | null;
		user_created: DirectusUser<Schema> | string | null;
		projects: DirectusDeploymentProject<Schema>[] | string[];
	}
>;

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
		status: 'building' | 'ready' | 'error' | 'canceled';
		target: string;
		url: string | null;
		date_created: 'datetime' | null;
		user_created: DirectusUser<Schema> | string | null;
	}
>;
