import type { MergeCoreCollection } from '../index.js';

export type DirectusExtension<Schema = any> = {
	id: string;
	bundle: string | null;
	schema: ExtensionSchema | ExtensionSchemaEntry | null;
	meta: MergeCoreCollection<
		Schema,
		'directus_extensions',
		{ id: string; source: 'module' | 'registry' | 'local'; enabled: boolean; bundle: string | null; folder: string }
	>;
};

export type ExtensionSchema = Partial<{
	path: string;
	name: string;
	local: boolean;
	version: string;
	host: string;
	type: ExtensionTypes;
	entrypoint: string | { app: string; api: string };
	partial: boolean;
	entries: ExtensionSchemaEntry[];
	sandbox: ExtensionSandboxOptions;
}>;

export type ExtensionSchemaEntry = {
	name: string;
	type: ExtensionTypes;
};

export type ExtensionSandboxOptions = {
	enabled: boolean;
	requestedScopes: {
		request?: { urls: string[]; methods: ('GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE')[] };
		log?: Record<string, never>;
		sleep?: Record<string, never>;
	};
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
