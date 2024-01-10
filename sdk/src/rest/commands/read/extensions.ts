import type { DirectusExtension } from '../../../schema/extension.js';
import type { RestCommand } from '../../types.js';

/**
 * List the available extensions in the project.
 * @returns An array of extensions.
 */
export const readExtensions =
	<Schema extends object>(): RestCommand<DirectusExtension<Schema>[], Schema> =>
	() => ({
		path: `/extensions/`,
		method: 'GET',
	});
