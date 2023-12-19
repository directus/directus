import type { MergeCoreCollection } from '../index.js';

export type DirectusExtension<Schema extends object> = MergeCoreCollection<
	Schema,
	'directus_extensions',
	{
		name: string;
		bundle: string | null;
		schema: { type: ExtensionTypes; local: boolean } | null;
		meta: { enabled: boolean };
	}
>;

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
