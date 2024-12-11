import type { Knex } from 'knex';

export interface ActiveUser {
	id: string;
	role: string | null;
}

export async function fetchActiveUsers(knex: Knex): Promise<ActiveUser[]> {
	return await knex.select('id', 'role').from('directus_users').where('status', 'active');
}
