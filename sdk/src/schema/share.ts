import type { CollectionName, MergeCoreCollection } from '../index.js';
import type { DirectusRole } from './role.js';
import type { DirectusUser } from './user.js';

export type DirectusShare<Schema = any> = MergeCoreCollection<
	Schema,
	'directus_shares',
	{
		id: string;
		name: string | null;
		collection: CollectionName<Schema>;
		item: string;
		role: DirectusRole<Schema> | string | null;
		password: string | null; // will just be *s
		user_created: DirectusUser<Schema> | string | null;
		date_created: 'datetime' | null;
		date_start: 'datetime' | null;
		date_end: 'datetime' | null;
		times_used: number | null;
		max_uses: number | null;
	}
>;
