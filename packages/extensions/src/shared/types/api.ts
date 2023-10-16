import type { Extension } from './extension-types.js';
import type { ExtensionSettings } from './settings.js';

type SchemaFields = 'type' | 'local';

/**
 * The API output structure used when engaging with the /extensions endpoints
 */
export interface ApiOutput {
	name: string;
	bundle: string | null;
	schema: Pick<Extension, SchemaFields> | null;
	meta: Omit<ExtensionSettings, 'name'>;
}
