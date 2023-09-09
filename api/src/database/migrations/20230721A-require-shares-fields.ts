import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_shares', (table) => {
		if (knex.client.constructor.name === 'Client_MySQL') {
			// Temporary drop foreign key constraint, see https://github.com/directus/directus/issues/19399
			table.dropForeign('collection', 'directus_shares_collection_foreign');
		}

		table.dropNullable('collection');

		if (knex.client.constructor.name === 'Client_MySQL') {
			// Recreate foreign key constraint, from 20211211A-add-shares.ts
			table.foreign('collection').references('directus_collections.collection').onDelete('CASCADE');
		}

		table.dropNullable('item');
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_shares', (table) => {
		if (knex.client.constructor.name === 'Client_MySQL') {
			// Temporary drop foreign key constraint, see https://github.com/directus/directus/issues/19399
			table.dropForeign('collection', 'directus_shares_collection_foreign');
		}

		table.setNullable('collection');

		if (knex.client.constructor.name === 'Client_MySQL') {
			// Recreate foreign key constraint, from 20211211A-add-shares.ts
			table.foreign('collection').references('directus_collections.collection').onDelete('CASCADE');
		}

		table.setNullable('item');
	});
}
