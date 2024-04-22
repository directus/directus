import type { MergeCoreCollection } from '../index.js';

export type DirectusTranslation<Schema = any> = MergeCoreCollection<
	Schema,
	'directus_translations',
	{
		id: string; // uuid
		language: string;
		key: string;
		value: string;
	}
>;
