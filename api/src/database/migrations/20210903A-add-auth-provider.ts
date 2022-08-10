import { Knex } from 'knex';
import { getHelpers } from '../helpers';

export async function up(knex: Knex): Promise<void> {
	const helper = getHelpers(knex).schema;

	await knex.schema.alterTable('directus_users', (table) => {
		table.dropUnique(['email']);
	});

	await knex.schema.alterTable('directus_users', (table) => {
		table.string('provider', 128).notNullable().defaultTo('default');
		table.string('external_identifier').unique();
	});

	await helper.changeToType('directus_users', 'email', 'string', {
		nullable: true,
		length: 128,
	});

	await knex.schema.alterTable('directus_users', (table) => {
		table.unique(['email']);
	});

	await knex.schema.alterTable('directus_sessions', (table) => {
		table.json('data');
	});
}

export async function down(knex: Knex): Promise<void> {
	const helper = getHelpers(knex).schema;

	await knex.schema.alterTable('directus_users', (table) => {
		table.dropColumn('provider');
		table.dropColumn('external_identifier');
	});

	await helper.changeToType('directus_users', 'email', 'string', {
		nullable: false,
		length: 128,
	});

	await knex.schema.alterTable('directus_sessions', (table) => {
		table.dropColumn('data');
	});
}
