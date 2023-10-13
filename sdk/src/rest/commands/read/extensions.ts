import type { RestCommand } from '../../types.js';

export type ExtensionTypes = "interface" | "display" | "layout" | "module" | "panel" | "hook" | "endpoint" | "operation" | "bundle";

/**
 * Copied from @directus/extensions
 * The API output structure used when engaging with the /extensions endpoints
 */
export interface ReadExtensionOutput {
	name: string;
	bundle: string | null;
	schema: { type: ExtensionTypes, local: boolean } | null;
	meta: { enabled: boolean; /* options, permissions? */ };
}


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
