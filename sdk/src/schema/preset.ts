import type { MergeCoreCollection } from '../index.js';
import type { DirectusRole } from './role.js';
import type { DirectusUser } from './user.js';

export type DirectusPreset<Schema extends object> = MergeCoreCollection<
	Schema,
	'directus_presets',
	{
		id: number;
		bookmark: string | null;
		user: DirectusUser<Schema> | string | null;
		role: DirectusRole<Schema> | string | null;
		collection: string | null; // TODO keyof complete schema
		search: string | null;
		layout: string | null;
		layout_query: 'json' | null;
		layout_options: 'json' | null;
		refresh_interval: number | null;
		filter: 'json' | null;
		icon: string | null;
		color: string | null;
	}
>;
