import type { MergeCoreCollection } from '../index.js';

export type DirectusTranslation<Schema extends object> = MergeCoreCollection<
	Schema,
	'directus_translations',
	{
		id: number;
		language: string;
		key: string;
		value: string;
	}
>;
