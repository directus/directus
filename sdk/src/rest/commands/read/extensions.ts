import type { RestCommand } from '../../types.js';
import type { ApiOutput as ReadExtensionOutput } from '@directus/extensions';

/**
 * List the available extensions in the project.
 * @returns An array of extensions.
 */
export const readExtensions =
	<Schema extends object>(): RestCommand<ReadExtensionOutput[], Schema> =>
	() => ({
		path: `/extensions/`,
		method: 'GET',
	});
