import { throwIfEmpty } from '../../utils/index.js';
import type { RestCommand } from '../../types.js';

export interface TriggerDeploymentResult {
	deployment_id: string;
	status: 'queued' | 'building' | 'ready' | 'error' | 'canceled';
	url?: string;
}

export interface TriggerDeploymentOptions {
	preview?: boolean;
	clearCache?: boolean;
}

/**
 * Trigger a new deployment for a project.
 *
 * @param provider The provider type (e.g. 'vercel')
 * @param projectId The project ID to deploy
 * @param options Deployment options (preview, clearCache)
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
			path: `/deployment/${provider}/projects/${projectId}/deploy`,
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
			path: `/deployment/${provider}/runs/${runId}/cancel`,
			method: 'POST',
		};
	};
