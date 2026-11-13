import { createInspector } from '@directus/schema';
import type { Knex } from 'knex';
import { getHelpers } from '../helpers/index.js';

export async function up(knex: Knex): Promise<void> {
	await knex('directus_sessions').whereNotNull('share').delete();

	await knex('directus_permissions').where('action', 'share').orWhere('collection', 'directus_shares').delete();

	const inspector = createInspector(knex);
	const foreignKeys = await inspector.foreignKeys('directus_sessions');
	const shareForeignKey = foreignKeys.find((fk) => fk.column === 'share');

	await knex.schema.alterTable('directus_sessions', (table) => {
		if (shareForeignKey) table.dropForeign('share', shareForeignKey.constraint_name ?? undefined);
		table.dropColumn('share');
	});

	await knex.schema.dropTable('directus_shares');
}

export async function down(knex: Knex): Promise<void> {
	const helpers = getHelpers(knex);

	await knex.schema.createTable('directus_shares', (table) => {
		table.uuid('id').primary().notNullable();
		table.string('name');

		table
			.string('collection', helpers.schema.getTableNameMaxLength())
			.notNullable()
			.references('collection')
			.inTable('directus_collections')
			.onDelete('CASCADE');

		table.string('item').notNullable();
		table.uuid('role').references('id').inTable('directus_roles').onDelete('CASCADE');
		table.string('password');
		table.uuid('user_created').references('id').inTable('directus_users').onDelete('SET NULL');
		table.timestamp('date_created').defaultTo(knex.fn.now());
		table.timestamp('date_start').nullable().defaultTo(null);
		table.timestamp('date_end').nullable().defaultTo(null);
		table.integer('times_used').defaultTo(0);
		table.integer('max_uses');
	});

	await knex.schema.alterTable('directus_sessions', (table) => {
		table.uuid('share').references('id').inTable('directus_shares').onDelete('CASCADE');
	});
}
