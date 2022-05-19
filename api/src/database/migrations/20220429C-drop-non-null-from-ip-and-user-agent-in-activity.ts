import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_activity', (table) => {
		table.setNullable('ip');
		table.setNullable('user_agent');
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_activity', (table) => {
		table.dropNullable('ip');
		table.dropNullable('user_agent');
	});
}
