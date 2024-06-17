import type { RestCommand } from '../../types.js';

/**
 * Retrieve the GraphQL SDL for the current project.
 * @returns GraphQL SDL.
 */
export const readGraphqlSdl =
	<Schema>(scope: 'item' | 'system' = 'item'): RestCommand<string, Schema> =>
	() => ({
		method: 'GET',
		path: scope === 'item' ? '/server/specs/graphql' : '/server/specs/graphql/system',
	});
