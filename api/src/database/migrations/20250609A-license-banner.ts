import type { Knex } from 'knex';
import { useEnv } from '@directus/env';

export async function up(knex: Knex): Promise<void> {
	const env = useEnv();

	const acceptedTerms: boolean = env['ACCEPT_TERMS'] as boolean;

	await knex.schema.alterTable('directus_settings', (table) => {
		table.boolean('accepted_terms').defaultTo(acceptedTerms);
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_settings', (table) => {
		table.dropColumn('accepted_terms');
	});
}
