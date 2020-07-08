import * as Knex from 'knex';

export async function seed(knex: Knex): Promise<any> {
	await knex.schema.dropTableIfExists('directus_collection_presets');

	await knex.schema.createTable('directus_collection_presets', (table) => {
		table.increments().notNullable();
		table.string('title').nullable();
		table.uuid('user').nullable();
		table.string('collection', 64).notNullable();
		// table.foreign('collection').references('directus_collections.collection');
		table.string('search_query', 100).nullable();
		table.json('filters').nullable();
		table.string('view_type', 100).notNullable();
		table.json('view_query').nullable();
		table.json('view_options').nullable();
		table.uuid('role').nullable();
	});
}
