import type { MergeCoreCollection } from '../index.js';

export type DirectusRole<Schema = any> = MergeCoreCollection<
	Schema,
	'directus_roles',
	{
		id: string;
		name: string;
		icon: string;
		description: string | null;
		ip_access: string | null;
		enforce_tfa: boolean;
		admin_access: boolean;
		app_access: boolean;
	}
>;
