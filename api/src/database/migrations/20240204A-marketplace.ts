import type { Knex } from 'knex';
import { randomUUID } from 'node:crypto';

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
		// Delete extension meta status that used the legacy `${name}:${type}` name syntax for
		// extension-folder scoped extensions
		if (name.includes(':')) {
			await knex('directus_extensions').delete().where({ name });
		} else {
			const id = randomUUID();
			/*
			 * Set all extensions to 'local' type, as there's no way to differentiate between
			 * 'local' and 'module' extensions  at this point.
			 * This will be cleaned-up after first start when settings are requested (get-extensions-settings.ts).
			 */
			await knex('directus_extensions').update({ id, source: 'local' }).where({ name });
			idMap.set(name, id);
		}
	}

	for (const { name } of installedExtensions) {
		if (!name.includes('/')) continue;

		const bundleParentName = name.split('/')[0];
		const bundleParentId = idMap.get(bundleParentName);

		if (!bundleParentId) continue;

		await knex('directus_extensions')
			.update({ bundle: bundleParentId, name: name.substring(bundleParentName.length + 1) })
			.where({ name });
	}

	await knex.schema.alterTable('directus_extensions', (table) => {
		table.dropPrimary();
		table.uuid('id').alter().primary().notNullable();
		table.string('source', 255).alter().notNullable().defaultTo('local');
		table.renameColumn('name', 'folder');
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_extensions', (table) => {
		table.dropColumns('id', 'source', 'bundle');
		table.renameColumn('folder', 'name');
	});

	await knex.schema.alterTable('directus_extensions', (table) => {
		table.string('name', 255).primary().alter();
	});
}
