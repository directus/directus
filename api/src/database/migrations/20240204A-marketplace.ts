import type { Knex } from 'knex';
import { v4 as uuid } from 'uuid';

export async function up(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_extensions', (table) => {
		table.uuid('id').nullable();
		table.string('source', 255);
	});

	const installedExtensions = await knex.select('name').from('directus_extensions');

	for (const { name } of installedExtensions) {
		await knex('directus_extensions').update({ id: uuid(), source: 'local' }).where({ name });
	}

	await knex.schema.alterTable('directus_extensions', (table) => {
		table.dropPrimary();
		table.uuid('id').alter().primary().notNullable();
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_extensions', (table) => {
		table.dropColumns('id', 'source');
		table.string('name', 255).primary().alter();
	});
}
