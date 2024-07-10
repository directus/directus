import type { MergeCoreCollection } from '../index.js';
import type { DirectusUser } from './user.js';
import type { DirectusPolicy } from './policy.js';

export type DirectusRole<Schema> = MergeCoreCollection<
	Schema,
	'directus_roles',
	{
		id: string;
		name: string;
		icon: string;
		description: string | null;
		parent: string | DirectusRole<Schema>;
		children: string[] | DirectusRole<Schema>[];
		policies: string[] | DirectusPolicy<Schema>[];
		users: string[] | DirectusUser<Schema>[];
	}
>;
