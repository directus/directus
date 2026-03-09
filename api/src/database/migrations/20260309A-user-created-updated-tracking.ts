import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	const isSQLite = knex.client.constructor.name === 'Client_SQLite3';

	await knex.schema.alterTable('directus_users', (table) => {
		if (isSQLite) {
			table.timestamp('date_created').nullable();
			table.timestamp('date_updated').nullable();
		} else {
			table.timestamp('date_created').defaultTo(knex.fn.now());
			table.timestamp('date_updated').defaultTo(knex.fn.now());
		}

		table.uuid('user_created').references('id').inTable('directus_users').onDelete('SET NULL');
		table.uuid('user_updated').references('id').inTable('directus_users').onDelete('SET NULL');
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_users', (table) => {
		table.dropColumn('date_created');
		table.dropColumn('date_updated');
		table.dropColumn('user_created');
		table.dropColumn('user_updated');
	});
}
