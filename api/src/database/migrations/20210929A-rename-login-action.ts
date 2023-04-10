import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	await knex('directus_activity')
		.update({
			action: 'login',
		})
		.where('action', '=', 'authenticate');
}

export async function down(knex: Knex): Promise<void> {
	await knex('directus_activity')
		.update({
			action: 'authenticate',
		})
		.where('action', '=', 'login');
}
