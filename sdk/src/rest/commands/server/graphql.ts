import type { RestCommand } from '../../types.js';

/**
 * Retrieve the OpenAPI spec for the current project.
 * @returns Object conforming to the OpenAPI Specification
 */
export const readGraphqlSdl =
	<Schema extends object>(scope: 'item' | 'system' = 'item'): RestCommand<string, Schema> =>
	() => ({
		method: 'GET',
		path: scope === 'item' ? '/server/specs/graphql' : '/server/specs/graphql/system',
	});
