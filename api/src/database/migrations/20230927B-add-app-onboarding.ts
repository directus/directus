import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_users', (table) => {
		table.json('onboarding').nullable();
	});

	await knex.schema.alterTable('directus_settings', (table) => {
		table.json('onboarding').nullable();
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_users', (table) => {
		table.dropColumn('onboarding');
	});

	await knex.schema.alterTable('directus_settings', (table) => {
		table.dropColumn('onboarding');
	});
}
