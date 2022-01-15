import { Knex } from 'knex';
import { getHelpers } from '../helpers';

export async function up(knex: Knex): Promise<void> {
	const helper = getHelpers(knex).schema;

	await knex.schema.alterTable('directus_relations', (table) => {
		table.dropColumns('many_primary', 'one_primary');
		table.string('one_deselect_action').defaultTo('nullify');
		table.string('sort_field', 64).alter();
	});

	await helper.changeToString('directus_relations', 'sort_field', {
		length: 64,
		nullable: true,
	});

	await knex.schema.alterTable('directus_relations', (table) => {
		table.string('one_deselect_action').notNullable().defaultTo('nullify').alter();
	});
}

export async function down(knex: Knex): Promise<void> {
	const helper = getHelpers(knex).schema;

	await helper.changeToString('directus_relations', 'sort_field', {
		length: 255,
	});

	await knex.schema.alterTable('directus_relations', (table) => {
		table.dropColumn('one_deselect_action');
		table.string('many_primary', 64);
		table.string('one_primary', 64);
	});
}
