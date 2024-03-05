import { resolvePackage } from '@directus/utils/node';
import type { Knex } from 'knex';
import { randomUUID } from 'node:crypto';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

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

			let source;

			try {
				// The NPM package name is the name used in the database. If we can resolve the
				// extension as a node module it's safe to assume it's a npm-module source
				resolvePackage(name, __dirname);
				source = 'module';
			} catch {
				source = 'local';
			}

			await knex('directus_extensions').update({ id, source }).where({ name });
			idMap.set(name, id);
		}
	}

	for (const { name } of installedExtensions) {
		if (!name.includes('/')) continue;

		const splittedName = name.split('/');

		const isScopedModuleBundleParent = name.startsWith('@') && splittedName.length == 2;

		if (isScopedModuleBundleParent) continue;

		const isScopedModuleBundleChild = name.startsWith('@') && splittedName.length > 2;

		const bundleParentName =
			isScopedModuleBundleParent || isScopedModuleBundleChild ? splittedName.slice(0, 2).join('/') : splittedName[0];

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
