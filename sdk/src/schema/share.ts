import type { MergeCoreCollection } from '../index.js';
import type { DirectusCollection } from './collection.js';
import type { DirectusRole } from './role.js';
import type { DirectusUser } from './user.js';

export type DirectusShare<Schema = any> = MergeCoreCollection<
	Schema,
	'directus_shares',
	{
		id: string;
		name: string | null;
		collection: DirectusCollection<Schema> | string;
		item: string;
		role: DirectusRole<Schema> | string | null;
		password: string | null;
		user_created: DirectusUser<Schema> | string | null;
		date_created: 'datetime' | null;
		date_start: 'datetime' | null;
		date_end: 'datetime' | null;
		times_used: number | null;
		max_uses: number | null;
	}
>;
