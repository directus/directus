import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_settings', (table) => {
		table.text('license_token').nullable().defaultTo(null);
		table.string('license_key').nullable().defaultTo(null);
		table.string('license_key_hash').nullable().defaultTo(null);
		table.string('license_status').defaultTo('inactive');
		table.string('license_terminal_status').nullable().defaultTo(null);
		table.timestamp('license_grace_on').nullable().defaultTo(null);
	});

	await knex('directus_settings').update({ license_grace_on: new Date() }).whereNull('license_grace_on');
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_settings', (table) => {
		table.dropColumn('license_token');
		table.dropColumn('license_key');
		table.dropColumn('license_key_hash');
		table.dropColumn('license_status');
		table.dropColumn('license_terminal_status');
		table.dropColumn('license_grace_on');
	});
}
