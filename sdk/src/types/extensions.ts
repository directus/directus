
export type ExtensionTypes = "interface" | "display" | "layout" | "module" | "panel" | "hook" | "endpoint" | "operation" | "bundle";

/**
 * Copied from @directus/extensions
 * The API output structure used when engaging with the /extensions endpoints
 */
export interface ExtensionItem {
	name: string;
	bundle: string | null;
	schema: { type: ExtensionTypes, local: boolean } | null;
	meta: { enabled: boolean; /* options, permissions? */ };
}
