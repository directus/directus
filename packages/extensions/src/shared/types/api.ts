import type { Extension } from './extension-types.js';
import type { ExtensionSettings } from './settings.js';

/**
 * The API output structure used when engaging with the /extensions endpoints
 */
export interface ApiOutput {
	name: string;
	bundle: string | null;
	schema: Partial<Extension> | null;
	meta: Omit<ExtensionSettings, 'name'>;
}
