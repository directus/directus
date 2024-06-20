import type { MergeCoreCollection } from '../index.js';
import type { DirectusPermission } from './permission.js';
import type { DirectusRole } from './role.js';
import type { DirectusUser } from './user.js';

export type DirectusPolicy<Schema> = MergeCoreCollection<
	Schema,
	'directus_policies',
	{
		id: string; // uuid
		icon: string;
		description: string | null;
		ip_access: string | null;
		enforce_tfa: boolean;
		admin_access: boolean;
		app_access: boolean;
		permissions: number[] | DirectusPermission<Schema>[];
		users: string[] | DirectusUser<Schema>[];
		roles: string[] | DirectusRole<Schema>[];
	}
>;
