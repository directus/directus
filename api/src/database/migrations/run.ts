import fse from 'fs-extra';
import { Knex } from 'knex';
import { orderBy } from 'lodash';
import path from 'path';
import env from '../../env';
import logger from '../../logger';
import { Migration } from '../../types';
import { dynamicImport } from '../../utils/dynamic-import';

// @ts-ignore
import formatTitle from '@directus/format-title';

export default async function run(database: Knex, direction: 'up' | 'down' | 'latest', log = true): Promise<void> {
	let migrationFiles = await fse.readdir(__dirname);

	const customMigrationsPath = path.resolve(env.EXTENSIONS_PATH, 'migrations');
	let customMigrationFiles =
		((await fse.pathExists(customMigrationsPath)) && (await fse.readdir(customMigrationsPath))) || [];

	migrationFiles = migrationFiles.filter((file: string) => /^[0-9]+[A-Z]-[^.]+\.(?:js|ts)$/.test(file));
	customMigrationFiles = customMigrationFiles.filter((file: string) => file.endsWith('.js'));

	const completedMigrations = await database.select<Migration[]>('*').from('directus_migrations').orderBy('version');

	const migrations = [
		...migrationFiles.map((path) => parseFilePath(path)),
		...customMigrationFiles.map((path) => parseFilePath(path, true)),
	].sort((a, b) => (a.version > b.version ? 1 : -1));

	const migrationKeys = new Set(migrations.map((m) => m.version));
	if (migrations.length > migrationKeys.size) {
		throw new Error('Migration keys collide! Please ensure that every migration uses a unique key.');
	}

	function parseFilePath(filePath: string, custom = false) {
		const version = filePath.split('-')[0];
		const name = formatTitle(filePath.split('-').slice(1).join('_').split('.')[0]);
		const completed = !!completedMigrations.find((migration) => migration.version === version);

		return {
			file: custom ? path.join(customMigrationsPath, filePath) : path.join(__dirname, filePath),
			version,
			name,
			completed,
		};
	}

	if (direction === 'up') await up();
	if (direction === 'down') await down();
	if (direction === 'latest') await latest();

	async function up() {
		const currentVersion = completedMigrations[completedMigrations.length - 1];

		let nextVersion: any;

		if (!currentVersion) {
			nextVersion = migrations[0];
		} else {
			nextVersion = migrations.find((migration) => {
				return migration.version > currentVersion.version && migration.completed === false;
			});
		}

		if (!nextVersion) {
			throw Error('Nothing to upgrade');
		}

		const { up } = await dynamicImport(nextVersion.file);

		if (log) {
			logger.info(`Applying ${nextVersion.name}...`);
		}

		await up(database);
		await database.insert({ version: nextVersion.version, name: nextVersion.name }).into('directus_migrations');
	}

	async function down() {
		const lastAppliedMigration = orderBy(completedMigrations, ['timestamp', 'version'], ['desc', 'desc'])[0];

		if (!lastAppliedMigration) {
			throw Error('Nothing to downgrade');
		}

		const migration = migrations.find((migration) => migration.version === lastAppliedMigration.version);

		if (!migration) {
			throw new Error("Couldn't find migration");
		}

		const { down } = await dynamicImport(migration.file);

		if (log) {
			logger.info(`Undoing ${migration.name}...`);
		}

		await down(database);
		await database('directus_migrations').delete().where({ version: migration.version });
	}

	async function latest() {
		for (const migration of migrations) {
			if (migration.completed === false) {
				const { up } = await dynamicImport(migration.file);

				if (log) {
					logger.info(`Applying ${migration.name}...`);
				}

				await up(database);
				await database.insert({ version: migration.version, name: migration.name }).into('directus_migrations');
			}
		}
	}
}
