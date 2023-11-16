import type { ExtensionItem } from '../../../types/index.js';
import type { RestCommand } from '../../types.js';

/**
 * List the available extensions in the project.
 * @returns An array of extensions.
 */
export const readExtensions =
	<Schema extends object>(): RestCommand<ExtensionItem[], Schema> =>
	() => ({
		path: `/extensions/`,
		method: 'GET',
	});
