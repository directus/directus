import type { MergeCoreCollection } from '../index.js';
import type { DirectusAccess } from './access.js';
import type { DirectusPermission } from './permission.js';

export type DirectusPolicy<Schema> = MergeCoreCollection<
	Schema,
	'directus_policies',
	{
		id: string; // uuid
		name: string;
		icon: string;
		description: string | null;
		ip_access: string | null;
		enforce_tfa: boolean;
		admin_access: boolean;
		app_access: boolean;
		permissions: number[] | DirectusPermission<Schema>[];
		users: string[] | DirectusAccess<Schema>[];
		roles: string[] | DirectusAccess<Schema>[];
	}
>;
