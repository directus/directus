import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_settings', (table) => {
		table
			.string('password_does_not_meet_policy_requirements_error_message')
			.defaultTo('Password does not fulfill password policy requirements');
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_settings', (table) => {
		table.dropColumn('password_does_not_meet_policy_requirements_error_message');
	});
}
