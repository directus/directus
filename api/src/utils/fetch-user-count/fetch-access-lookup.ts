import type { Knex } from 'knex';

export interface AccessLookup {
	role: string | null;
	user: string | null;
	app_access: boolean | number;
	admin_access: boolean | number;
}

export async function fetchAccessLookup(knex: Knex): Promise<AccessLookup[]> {
	return await knex
		.select(
			'directus_access.role',
			'directus_access.user',
			'directus_policies.app_access',
			'directus_policies.admin_access',
		)
		.from('directus_access')
		.leftJoin('directus_policies', 'directus_access.policy', 'directus_policies.id');
}
