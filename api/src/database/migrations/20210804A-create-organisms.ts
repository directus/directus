import { Knex } from 'knex';
import { getDefaultIndexName } from '../../utils/get-default-index-name';

export async function up(knex: Knex): Promise<void> {
	await knex.schema.createTable('directus_organisms', (table) => {
		table.uuid('id').primary();
		table.string('name', 255).notNullable();
		table.string('status', 255).defaultTo('draft').notNullable();
		table.string('website_url').nullable();
		table.string('color').nullable();
		table.string('logo').nullable();
	});

	await knex.schema.createTable('directus_organisms_users', (table) => {
		table.uuid('id').primary();

		table.unique(['organism', 'user', 'role'], {
			indexName: getDefaultIndexName('unique', 'directus_organisms', ['organism', 'user', 'role']),
		});

		table
			.uuid('organism')
			.references('id')
			.inTable('directus_organisms')
			.withKeyName(getDefaultIndexName('foreign', 'directus_organisms_users', 'organism'));

		table
			.uuid('user')
			.references('id')
			.inTable('directus_users')
			.withKeyName(getDefaultIndexName('foreign', 'directus_organisms_users', 'user'));

		table
			.uuid('role')
			.references('id')
			.inTable('directus_roles')
			.withKeyName(getDefaultIndexName('foreign', 'directus_organisms_roles', 'role'));
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.dropTable('directus_organisms_users');
	await knex.schema.dropTable('directus_organisms');
}
