import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	await knex('directus_flows').update({ trigger: 'event' }).where('trigger', '=', 'hook');
}

export async function down(knex: Knex): Promise<void> {
	await knex('directus_flows').update({ trigger: 'hook' }).where('trigger', '=', 'event');
}
