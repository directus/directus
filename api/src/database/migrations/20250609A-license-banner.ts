import { useEnv } from '@directus/env';
import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	const { ACCEPT_TERMS } = useEnv();

	await knex.schema.alterTable('directus_settings', (table) => {
		table.boolean('accepted_terms').defaultTo(ACCEPT_TERMS);
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_settings', (table) => {
		table.dropColumn('accepted_terms');
	});
}
