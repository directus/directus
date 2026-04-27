import type { DirectusExtension } from '../../../schema/extension.js';
import type {
	DirectusExtensionRegistryList,
	DirectusExtensionRegistryQuery,
} from '../../../schema/registry-extension.js';
import type { RestCommand } from '../../types.js';

/**
 * List the available extensions in the project.
 * @returns An array of extensions.
 */
export const readExtensions =
	<Schema>(): RestCommand<DirectusExtension<Schema>[], Schema> =>
	() => ({
		path: `/extensions/`,
		method: 'GET',
	});

/**
 * List extensions available in the registry.
 * @param query - Optional query parameters (search, limit, offset, sort, filter)
 * @returns Paginated list of registry extensions with meta.
 */
export const readRegistryExtensions =
	<Schema>(query?: DirectusExtensionRegistryQuery): RestCommand<DirectusExtensionRegistryList, Schema> =>
	() => ({
		path: `/extensions/registry`,
		params: query ?? {},
		method: 'GET',
	});
