import type { AllCollections, MergeCoreCollection, SingletonCollections } from '../index.js';
import type { DirectusUser } from './user.js';

export type DirectusComment<Schema> = MergeCoreCollection<
	Schema,
	'directus_comments',
	{
		id: string;
		collection: AllCollections<Schema> | SingletonCollections<Schema>;
		item: string;
		comment: string;
		date_created: 'datetime' | null;
		date_updated: 'datetime' | null;
		user_created: DirectusUser<Schema> | string | null;
		user_updated: DirectusUser<Schema> | string | null;
	}
>;
