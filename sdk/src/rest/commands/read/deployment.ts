import type {
	DirectusDeployment,
	DirectusDeploymentProject,
	DirectusDeploymentRun,
} from '../../../schema/deployment.js';
import type { ApplyQueryFields, DirectusMeta, Query } from '../../../types/index.js';
import type { RestCommand } from '../../types.js';
import { throwIfEmpty } from '../../utils/index.js';

export type ReadDeploymentOutput<
	Schema,
	TQuery extends Query<Schema, Item>,
	Item extends object = DirectusDeployment<Schema>,
> = ApplyQueryFields<Schema, Item, TQuery['fields']>;

export type ReadDeploymentProjectOutput<
	Schema,
	TQuery extends Query<Schema, Item>,
	Item extends object = DirectusDeploymentProject<Schema>,
> = ApplyQueryFields<Schema, Item, TQuery['fields']>;

export type ReadDeploymentRunOutput<
	Schema,
	TQuery extends Query<Schema, Item>,
	Item extends object = DirectusDeploymentRun<Schema>,
> = ApplyQueryFields<Schema, Item, TQuery['fields']>;

export interface DeploymentDashboardOutput {
	projects: Array<{
		id: string;
		external_id: string;
		name: string;
		url?: string;
		framework?: string;
		deployable: boolean;
		latest_deployment?: {
			status: 'building' | 'ready' | 'error' | 'canceled';
			created_at: string;
			finished_at?: string;
		};
	}>;
}

export interface DeploymentRunsOutput {
	id: string;
	project: string;
	external_id: string;
	target: string;
	status: 'building' | 'ready' | 'error' | 'canceled';
	url?: string;
	date_created: string;
	finished_at?: string;
	author?: string;
}

export interface DeploymentRunsResponse {
	data: DeploymentRunsOutput[];
	meta?: DirectusMeta;
}

/**
 * List all configured deployment providers.
 * @param query The query parameters
 * @returns An array of deployment objects.
 */
export const readDeployments =
	<Schema, const TQuery extends Query<Schema, DirectusDeployment<Schema>>>(
		query?: TQuery,
	): RestCommand<ReadDeploymentOutput<Schema, TQuery>[], Schema> =>
		() => ({
			path: `/deployment`,
			params: query ?? {},
			method: 'GET',
		});

/**
 * Get a deployment provider by type.
 * @param provider The provider type (e.g. 'vercel')
 * @param query The query parameters
 * @returns The deployment object.
 * @throws Will throw if provider is empty
 */
export const readDeployment =
	<Schema, const TQuery extends Query<Schema, DirectusDeployment<Schema>>>(
		provider: string,
		query?: TQuery,
	): RestCommand<ReadDeploymentOutput<Schema, TQuery>, Schema> =>
		() => {
			throwIfEmpty(provider, 'Provider cannot be empty');

			return {
				path: `/deployment/${provider}`,
				params: query ?? {},
				method: 'GET',
			};
		};

/**
 * Get deployment dashboard for a provider.
 * Returns selected projects with latest deployment status and stats.
 * @param provider The provider type (e.g. 'vercel')
 * @returns Dashboard data with projects and stats.
 * @throws Will throw if provider is empty
 */
export const readDeploymentDashboard =
	<Schema>(provider: string): RestCommand<DeploymentDashboardOutput, Schema> =>
		() => {
			throwIfEmpty(provider, 'Provider cannot be empty');

			return {
				path: `/deployment/${provider}/dashboard`,
				method: 'GET',
			};
		};

/**
 * List projects for a deployment provider.
 * @param provider The provider type (e.g. 'vercel')
 * @param query The query parameters
 * @returns An array of project objects from the provider.
 * @throws Will throw if provider is empty
 */
export const readDeploymentProjects =
	<Schema, const TQuery extends Query<Schema, DirectusDeploymentProject<Schema>>>(
		provider: string,
		query?: TQuery,
	): RestCommand<ReadDeploymentProjectOutput<Schema, TQuery>[], Schema> =>
		() => {
			throwIfEmpty(provider, 'Provider cannot be empty');

			return {
				path: `/deployment/${provider}/projects`,
				params: query ?? {},
				method: 'GET',
			};
		};

/**
 * Get a specific project from a deployment provider.
 * @param provider The provider type (e.g. 'vercel')
 * @param projectId The project ID
 * @param query The query parameters
 * @returns The project object.
 * @throws Will throw if provider or projectId is empty
 */
export const readDeploymentProject =
	<Schema, const TQuery extends Query<Schema, DirectusDeploymentProject<Schema>>>(
		provider: string,
		projectId: string,
		query?: TQuery,
	): RestCommand<ReadDeploymentProjectOutput<Schema, TQuery>, Schema> =>
		() => {
			throwIfEmpty(provider, 'Provider cannot be empty');
			throwIfEmpty(projectId, 'Project ID cannot be empty');

			return {
				path: `/deployment/${provider}/projects/${projectId}`,
				params: query ?? {},
				method: 'GET',
			};
		};

/**
 * List deployment runs for a project.
 * @param provider The provider type (e.g. 'vercel')
 * @param projectId The project ID
 * @param query Optional query parameters (search, limit, offset, meta)
 * @returns Deployment runs with optional meta for pagination.
 * @throws Will throw if provider or projectId is empty
 */
export const readDeploymentRuns =
	<Schema>(
		provider: string,
		projectId: string,
		query?: { search?: string; limit?: number; offset?: number; meta?: string },
	): RestCommand<DeploymentRunsResponse, Schema> =>
		() => {
			throwIfEmpty(provider, 'Provider cannot be empty');
			throwIfEmpty(projectId, 'Project ID cannot be empty');

			return {
				path: `/deployment/${provider}/projects/${projectId}/runs`,
				params: query ?? {},
				method: 'GET',
			};
		};

/**
 * Get a specific deployment run with logs.
 * @param provider The provider type (e.g. 'vercel')
 * @param runId The run ID
 * @param query The query parameters (supports 'since' for incremental logs)
 * @returns The deployment run object with details and logs.
 * @throws Will throw if provider or runId is empty
 */
export const readDeploymentRun =
	<Schema, const TQuery extends Query<Schema, DirectusDeploymentRun<Schema>>>(
		provider: string,
		runId: string,
		query?: TQuery,
	): RestCommand<ReadDeploymentRunOutput<Schema, TQuery>, Schema> =>
		() => {
			throwIfEmpty(provider, 'Provider cannot be empty');
			throwIfEmpty(runId, 'Run ID cannot be empty');

			return {
				path: `/deployment/${provider}/runs/${runId}`,
				params: query ?? {},
				method: 'GET',
			};
		};
