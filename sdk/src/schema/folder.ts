import type { MergeCoreCollection } from '../index.js';

export type DirectusFolder<Schema = any> = MergeCoreCollection<
	Schema,
	'directus_folders',
	{
		id: string;
		name: string;
		parent: DirectusFolder<Schema> | string | null;
	}
>;
