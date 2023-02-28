import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_operations', (table) => {
		table.dropForeign('resolve');
		table.dropForeign('reject');
		table.foreign('resolve').references('id').inTable('directus_operations').onDelete('SET NULL');
		table.foreign('reject').references('id').inTable('directus_operations').onDelete('SET NULL');
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_operations', (table) => {
		table.dropForeign('resolve');
		table.dropForeign('reject');
		table.foreign('resolve').references('id').inTable('directus_operations');
		table.foreign('reject').references('id').inTable('directus_operations');
	});
}
