import type { DirectusDeployment, DirectusDeploymentProject } from '../../../schema/deployment.js';
import type { ApplyQueryFields, NestedPartial, Query } from '../../../types/index.js';
import type { RestCommand } from '../../types.js';
import { throwIfEmpty } from '../../utils/index.js';

export type UpdateDeploymentOutput<
	Schema,
	TQuery extends Query<Schema, Item>,
	Item extends object = DirectusDeployment<Schema>,
> = ApplyQueryFields<Schema, Item, TQuery['fields']>;

/**
 * Update an existing deployment provider.
 *
 * @param provider The provider type (e.g. 'vercel')
 * @param item The deployment fields to update
 * @param query Optional return data query
 *
 * @returns Returns the updated deployment object.
 * @throws Will throw if provider is empty
 */
export const updateDeployment =
	<Schema, const TQuery extends Query<Schema, DirectusDeployment<Schema>>>(
		provider: string,
		item: NestedPartial<DirectusDeployment<Schema>>,
		query?: TQuery,
	): RestCommand<UpdateDeploymentOutput<Schema, TQuery>, Schema> =>
		() => {
			throwIfEmpty(provider, 'Provider cannot be empty');

			return {
				path: `/deployments/${provider}`,
				params: query ?? {},
				body: JSON.stringify(item),
				method: 'PATCH',
			};
		};

export interface UpdateDeploymentProjectsInput {
	create?: Array<{ external_id: string; name: string }>;
	delete?: string[];
}

/**
 * Update selected projects for a deployment provider.
 *
 * @param provider The provider type (e.g. 'vercel')
 * @param item Projects to create or delete
 *
 * @returns Returns the updated list of selected projects.
 * @throws Will throw if provider is empty
 */
export const updateDeploymentProjects =
	<Schema>(
		provider: string,
		item: UpdateDeploymentProjectsInput,
	): RestCommand<DirectusDeploymentProject<Schema>[], Schema> =>
		() => {
			throwIfEmpty(provider, 'Provider cannot be empty');

			return {
				path: `/deployments/${provider}/projects`,
				body: JSON.stringify(item),
				method: 'PATCH',
			};
		};
