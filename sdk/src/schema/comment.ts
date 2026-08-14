import type { CollectionName, MergeCoreCollection } from '../index.js';
import type { DirectusUser } from './user.js';

export type DirectusComment<Schema> = MergeCoreCollection<
	Schema,
	'directus_comments',
	{
		id: string;
		collection: CollectionName<Schema>;
		item: string;
		comment: string;
		date_created: 'datetime' | null;
		date_updated: 'datetime' | null;
		user_created: DirectusUser<Schema> | string | null;
		user_updated: DirectusUser<Schema> | string | null;
	}
>;
