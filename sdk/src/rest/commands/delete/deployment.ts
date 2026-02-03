import type { RestCommand } from '../../types.js';
import { throwIfEmpty } from '../../utils/index.js';

/**
 * Delete a deployment provider.
 *
 * @param provider The provider type (e.g. 'vercel')
 *
 * @returns Nothing
 * @throws Will throw if provider is empty
 */
export const deleteDeployment =
	<Schema>(provider: string): RestCommand<void, Schema> =>
	() => {
		throwIfEmpty(provider, 'Provider cannot be empty');

		return {
			path: `/deployments/${provider}`,
			method: 'DELETE',
		};
	};
