import type { MergeCoreCollection } from '../index.js';
import type { DirectusRevision } from './revision.js';
import type { DirectusUser } from './user.js';

export type DirectusActivity<Schema extends object> = MergeCoreCollection<
	Schema,
	'directus_activity',
	{
		id: number;
		action: string;
		user: DirectusUser<Schema> | string | null;
		timestamp: 'datetime';
		ip: string | null;
		user_agent: string | null;
		collection: string;
		item: string;
		comment: string | null;
		origin: string | null;
		revisions: DirectusRevision<Schema>[] | number[] | null;
	}
>;
