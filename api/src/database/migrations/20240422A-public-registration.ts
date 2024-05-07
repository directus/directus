import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_settings', (table) => {
		table.boolean('public_registration').notNullable().defaultTo(false);
		table.boolean('public_registration_verify_email').notNullable().defaultTo(true);
		table.uuid('public_registration_role').nullable();
		table.foreign('public_registration_role').references('directus_roles.id').onDelete('SET NULL');
		table.json('public_registration_email_filter').nullable();
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_settings', (table) => {
		table.dropColumns(
			'public_registration',
			'public_registration_verify_email',
			'public_registration_role',
			'public_registration_email_filter',
		);
	});
}
