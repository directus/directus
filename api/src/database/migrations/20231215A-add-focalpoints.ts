import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_files', (table) => {
		table.integer('focal_point_x').nullable();
		table.integer('focal_point_y').nullable();
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_files', (table) => {
		table.dropColumn('focal_point_x');
		table.dropColumn('focal_point_y');
	});
}
