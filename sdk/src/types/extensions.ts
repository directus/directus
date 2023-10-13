export type ExtensionTypes =
	| 'interface'
	| 'display'
	| 'layout'
	| 'module'
	| 'panel'
	| 'hook'
	| 'endpoint'
	| 'operation'
	| 'bundle';

/**
 * The API output structure used when engaging with the /extensions endpoints
 * (Copied from `@directus/extensions`)
 */
export interface ExtensionItem {
	name: string;
	bundle: string | null;
	schema: { type: ExtensionTypes; local: boolean } | null;
	meta: { enabled: boolean };
}
