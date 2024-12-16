import type { MergeCoreCollection } from '../index.js';
import type { DirectusPolicy } from './policy.js';
import type { DirectusRole } from './role.js';
import type { DirectusUser } from './user.js';

export type DirectusAccess<Schema = any> = MergeCoreCollection<
	Schema,
	'directus_access',
	{
		id: string; // uuid
		role: string | DirectusRole<Schema>;
		user: string | DirectusUser<Schema>;
		policy: string | DirectusPolicy<Schema>;
		sort: number;
	}
>;
