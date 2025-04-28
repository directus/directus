import type { Knex } from 'knex';
import { getHelpers } from '../helpers/index.js';

export async function up(knex: Knex): Promise<void> {
	const helpers = getHelpers(knex);

	await knex.schema.createTable('directus_shares', (table) => {
		table.uuid('id').primary().notNullable();
		table.string('name');

		table
			.string('collection', helpers.schema.getTableNameMaxLength())
			.references('collection')
			.inTable('directus_collections')
			.onDelete('CASCADE');

		table.string('item');
		table.uuid('role').references('id').inTable('directus_roles').onDelete('CASCADE');
		table.string('password');
		table.uuid('user_created').references('id').inTable('directus_users').onDelete('SET NULL');
		table.timestamp('date_created').defaultTo(knex.fn.now());

		// This was changed after the migration went live to retroactively fix mysql5, see #10693
		table.timestamp('date_start').nullable().defaultTo(null);
		table.timestamp('date_end').nullable().defaultTo(null);

		table.integer('times_used').defaultTo(0);
		table.integer('max_uses');
	});

	await knex.schema.alterTable('directus_sessions', (table) => {
		table.dropColumn('data');
	});

	await knex.schema.alterTable('directus_sessions', (table) => {
		table.setNullable('user');
		table.uuid('share').references('id').inTable('directus_shares').onDelete('CASCADE');
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_sessions', (table) => {
		table.uuid('user').notNullable().alter();
		table.json('data');
		table.dropForeign('share');
		table.dropColumn('share');
	});

	await knex.schema.dropTable('directus_shares');
}
