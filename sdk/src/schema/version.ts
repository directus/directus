import type { CollectionName, MergeCoreCollection } from '../index.js';
import type { DirectusUser } from './user.js';

export type DirectusVersion<Schema = any> = MergeCoreCollection<
	Schema,
	'directus_versions',
	{
		id: string;
		key: string;
		name: string | null;
		collection: CollectionName<Schema>;
		item: string | null;
		hash: string | null;
		date_created: 'datetime' | null;
		date_updated: 'datetime' | null;
		user_created: DirectusUser<Schema> | string | null;
		user_updated: DirectusUser<Schema> | string | null;
		delta: Record<string, any> | null;
	}
>;
