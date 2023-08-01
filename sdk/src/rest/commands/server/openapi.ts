import type { RestCommand } from '../../types.js';

// TODO can we type this?
export type OpenApiSpecOutput = Record<string, any>;

/**
 * Retrieve the OpenAPI spec for the current project.
 * @returns Object conforming to the OpenAPI Specification
 */
export const readOpenApiSpec =
	<Schema extends object>(): RestCommand<OpenApiSpecOutput, Schema> =>
	() => ({
		method: 'GET',
		path: '/server/specs/oas',
	});
