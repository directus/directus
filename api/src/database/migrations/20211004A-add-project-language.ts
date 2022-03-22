import { Knex } from 'knex';
import { getHelpers } from '../helpers';

export async function up(knex: Knex): Promise<void> {
	const helper = getHelpers(knex).schema;

	await knex.schema.alterTable('directus_settings', (table) => {
		table.string('project_language').notNullable().defaultTo('en-US');
	});

	if (helper.isOneOfClients(['cockroachdb'])) {
		knex.schema.raw('ALTER TABLE directus_users ALTER COLUMN language SET DEFAULT NULL');
	} else {
		await knex.schema.alterTable('directus_users', (table) => {
			table.string('language').nullable().defaultTo(null).alter();
		});
	}
}

export async function down(knex: Knex): Promise<void> {
	const helper = getHelpers(knex).schema;

	await knex.schema.alterTable('directus_settings', (table) => {
		table.dropColumn('project_language');
	});

	if (helper.isOneOfClients(['cockroachdb'])) {
		knex.schema.raw("ALTER TABLE directus_users ALTER COLUMN language SET DEFAULT 'en-US'");
	} else {
		await knex.schema.alterTable('directus_users', (table) => {
			table.string('language').nullable().defaultTo('en-US');
		});
	}
}
