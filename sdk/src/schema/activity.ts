import type { AllCollections, MergeCoreCollection, SingletonCollections } from '../index.js';
import type { DirectusRevision } from './revision.js';
import type { DirectusUser } from './user.js';

export type DirectusActivity<Schema = any> = MergeCoreCollection<
	Schema,
	'directus_activity',
	{
		id: number;
		action: string;
		user: DirectusUser<Schema> | string | null;
		timestamp: 'datetime';
		ip: string | null;
		user_agent: string | null;
		collection: AllCollections<Schema> | SingletonCollections<Schema>;
		item: string;
		origin: string | null;
		revisions: DirectusRevision<Schema>[] | number[] | null;
	}
>;
