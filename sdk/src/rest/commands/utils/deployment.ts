import type { RestCommand } from '../../types.js';
import { throwIfEmpty } from '../../utils/index.js';

export interface TriggerDeploymentResult {
	id: string;
	external_id: string;
	project: string;
	target: string;
	status: 'building' | 'ready' | 'error' | 'canceled';
	url?: string;
	date_created: string;
}

export interface TriggerDeploymentOptions {
	preview?: boolean;
	clear_cache?: boolean;
}

/**
 * Trigger a new deployment for a project.
 *
 * @param provider The provider type (e.g. 'vercel')
 * @param projectId The project ID to deploy
 * @param options Deployment options (preview, clear_cache)
 *
 * @returns The deployment trigger result with deployment ID and status.
 * @throws Will throw if provider or projectId is empty
 */
export const triggerDeployment =
	<Schema>(
		provider: string,
		projectId: string,
		options?: TriggerDeploymentOptions,
	): RestCommand<TriggerDeploymentResult, Schema> =>
	() => {
		throwIfEmpty(provider, 'Provider cannot be empty');
		throwIfEmpty(projectId, 'Project ID cannot be empty');

		return {
			path: `/deployments/${provider}/projects/${projectId}/deploy`,
			method: 'POST',
			...(options && { body: JSON.stringify(options) }),
		};
	};

/**
 * Cancel a deployment run.
 *
 * @param provider The provider type (e.g. 'vercel')
 * @param runId The run ID to cancel
 *
 * @returns The updated run object.
 * @throws Will throw if provider or runId is empty
 */
export const cancelDeployment =
	<Schema>(provider: string, runId: string): RestCommand<TriggerDeploymentResult, Schema> =>
	() => {
		throwIfEmpty(provider, 'Provider cannot be empty');
		throwIfEmpty(runId, 'Run ID cannot be empty');

		return {
			path: `/deployments/${provider}/runs/${runId}/cancel`,
			method: 'POST',
		};
	};
