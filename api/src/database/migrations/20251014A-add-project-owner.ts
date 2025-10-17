import { toBoolean } from '@directus/utils';
import type { Knex } from 'knex';
import { env } from 'process';

export async function up(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_settings', (table) => {
		table.string('project_owner');
		table.dropColumn('accepted_terms');
	});
}

export async function down(knex: Knex): Promise<void> {
	const acceptedTerms: boolean = toBoolean(env['ACCEPT_TERMS']);

	await knex.schema.alterTable('directus_settings', (table) => {
		table.dropColumn('project_owner');
		table.boolean('accepted_terms').defaultTo(acceptedTerms);
	});
}
