import type { Knex } from 'knex';
import { v4 as uuid } from 'uuid';

export async function up(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_extensions', (table) => {
		table.uuid('id').nullable();
		table.string('source', 255);
		table.uuid('bundle');
	});

	const installedExtensions = await knex.select('name').from('directus_extensions');

	// name: id
	const idMap = new Map<string, string>();

	for (const { name } of installedExtensions) {
		const id = uuid();
		await knex('directus_extensions').update({ id, source: 'local' }).where({ name });
		idMap.set(name, id);
	}

	// This will also include flat extensions with an NPM org scope, but there's no way to identify
	// those
	const bundleNames = Array.from(idMap.keys()).filter((name) => name.includes('/'));

	for (const { name } of installedExtensions) {
		const bundleParent = bundleNames.find((bundleName) => name.startsWith(bundleName + '/'));

		if (!bundleParent) continue;

		await knex('directus_extensions')
			.update({ bundle: idMap.get(bundleParent) })
			.where({ name });
	}

	await knex.schema.alterTable('directus_extensions', (table) => {
		table.dropPrimary();
		table.uuid('id').alter().primary().notNullable();
		table.string('source', 255).alter().notNullable().defaultTo('local');
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_extensions', (table) => {
		table.dropColumns('id', 'source', 'bundle');
		table.string('name', 255).primary().alter();
	});
}
