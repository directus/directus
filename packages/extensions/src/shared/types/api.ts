import type { BundleExtensionEntry, Extension } from './extension-types.js';
import type { ExtensionSettings } from './settings.js';

/**
 * The API output structure used when engaging with the /extensions endpoints
 */
export interface ApiOutput {
	id: string;
	bundle: string | null;
	schema: Partial<Extension> | BundleExtensionEntry | null;
	meta: ExtensionSettings;
}
