import type { RestCommand } from '../../types.js';

// TODO figure out the type here
export interface ReadExtensionOutput {
	name: string;
	type: ExtensionTypes;
	local: boolean;
	entries: any[];
}

// not using the types from @directus/types because they're singular
export type ExtensionTypes =
	| 'interfaces'
	| 'displays'
	| 'layouts'
	| 'modules'
	| 'panels'
	| 'hooks'
	| 'endpoints'
	| 'operation'
	| 'bundles';

/**
 * List the available extensions in the project.
 * @param type The extension type
 * @returns An array of interface extension keys.
 */
export const readExtensions =
	<Schema extends object>(type: ExtensionTypes): RestCommand<ReadExtensionOutput[], Schema> =>
	() => ({
		path: `/extensions/${type}`,
		method: 'GET',
	});
