import type { DirectusDeployment, DirectusDeploymentCredentials } from '../../../schema/deployment.js';
import type { ApplyQueryFields, NestedPartial, Query } from '../../../types/index.js';
import type { RestCommand } from '../../types.js';

export type CreateDeploymentOutput<
	Schema,
	TQuery extends Query<Schema, Item>,
	Item extends object = DirectusDeployment<Schema>,
> = ApplyQueryFields<Schema, Item, TQuery['fields']>;

/**
 * Create a new deployment provider.
 *
 * @param item The deployment to create
 * @param query Optional return data query
 *
 * @returns Returns the created deployment object.
 */
export const createDeployment =
	<Schema, const TQuery extends Query<Schema, DirectusDeployment<Schema>>>(
		item: NestedPartial<Omit<DirectusDeployment<Schema>, 'credentials'>> & {
			credentials: DirectusDeploymentCredentials;
		},
		query?: TQuery,
	): RestCommand<CreateDeploymentOutput<Schema, TQuery>, Schema> =>
	() => ({
		path: `/deployments`,
		params: query ?? {},
		body: JSON.stringify(item),
		method: 'POST',
	});
