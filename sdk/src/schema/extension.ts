import type { MergeCoreCollection } from '../index.js';

export type DirectusExtension<Schema = any> = {
	id: string;
	bundle: string | null;
	schema: ExtensionSchema | null;
	meta: MergeCoreCollection<
		Schema,
		'directus_extensions',
		{ id: string; source: 'module' | 'registry' | 'local'; enabled: boolean; bundle: string | null; folder: string }
	>;
};

export type ExtensionSchema = {
	type: ExtensionTypes;
	local: boolean;
	version?: string;
};

export type ExtensionTypes =
	| 'interface'
	| 'display'
	| 'layout'
	| 'module'
	| 'panel'
	| 'theme'
	| 'hook'
	| 'endpoint'
	| 'operation'
	| 'bundle';
