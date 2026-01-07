import { randomUUID } from 'node:crypto';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolvePackage } from '@directus/utils/node';
import type { Knex } from 'knex';
import { getHelpers } from '../helpers/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

export async function up(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_extensions', (table) => {
		table.uuid('id').nullable();
		table.string('folder');
		table.string('source');
		table.uuid('bundle');
	});

	const installedExtensions = await knex.select('name').from('directus_extensions');

	// name: id
	const idMap = new Map<string, { id: string; source: 'local' | 'module' }>();

	for (const { name } of installedExtensions) {
		// Delete extension meta status that used the legacy `${name}:${type}` name syntax for
		// extension-folder scoped extensions
		if (name.includes(':')) {
			await knex('directus_extensions').delete().where({ name });
		} else {
			const id = randomUUID();

			let source: 'local' | 'module';

			try {
				// The NPM package name is the name used in the database. If we can resolve the
				// extension as a node module it's safe to assume it's a npm-module source
				resolvePackage(name, __dirname);
				source = 'module';
			} catch {
				source = 'local';
			}

			await knex('directus_extensions').update({ id, source, folder: name }).where({ name });
			idMap.set(name, { id, source });
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

		const bundleParent = idMap.get(bundleParentName);

		if (!bundleParent) continue;

		await knex('directus_extensions')
			.update({
				bundle: bundleParent.id,
				folder: name.substring(bundleParentName.length + 1),
				source: bundleParent.source,
			})
			.where({ folder: name });
	}

	await knex.schema.alterTable('directus_extensions', (table) => {
		table.uuid('id').alter().notNullable();
	});

	await knex.transaction(async (trx) => {
		const helpers = getHelpers(trx);

		await helpers.schema.changePrimaryKey('directus_extensions', ['id']);

		await trx.schema.alterTable('directus_extensions', (table) => {
			table.dropColumn('name');
			table.string('source').alter().notNullable();
			table.string('folder').alter().notNullable();
		});
	});
}

/*
 * Note: For local extensions having a different package & folder name,
 * we aren't able to revert to the exact same state as before.
 * But we still need to do the name convertion, in order for the migration to succeed.
 */
export async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_extensions', (table) => {
		table.string('name');
	});

	const installedExtensions = await knex.select(['id', 'folder', 'bundle', 'source']).from('directus_extensions');

	const idMap = new Map<string, string>(installedExtensions.map((extension) => [extension.id, extension.folder]));

	for (const { id, folder, bundle, source } of installedExtensions) {
		if (source === 'registry') {
			await knex('directus_extensions').delete().where({ id });
			continue;
		}

		let name = folder;

		if (bundle) {
			const bundleParentName = idMap.get(bundle);

			name = `${bundleParentName}/${name}`;
		}

		await knex('directus_extensions').update({ name }).where({ id });
	}

	await knex.transaction(async (trx) => {
		const helpers = getHelpers(trx);

		await helpers.schema.changePrimaryKey('directus_extensions', ['name']);

		await trx.schema.alterTable('directus_extensions', (table) => {
			table.dropColumns('id', 'folder', 'source', 'bundle');
			table.string('name').alter().notNullable();
		});
	});
}
