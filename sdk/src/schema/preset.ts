import type { CollectionName, MergeCoreCollection } from '../index.js';
import type { DirectusRole } from './role.js';
import type { DirectusUser } from './user.js';

export type DirectusPreset<Schema = any> = MergeCoreCollection<
	Schema,
	'directus_presets',
	{
		id: number;
		bookmark: string | null;
		user: DirectusUser<Schema> | string | null;
		role: DirectusRole<Schema> | string | null;
		collection: CollectionName<Schema> | null;
		search: string | null;
		layout: string | null;
		layout_query: Record<string, any> | null;
		layout_options: Record<string, any> | null;
		refresh_interval: number | null;
		filter: Record<string, any> | null;
		icon: string | null;
		color: string | null;
	}
>;
