import fse from 'fs-extra';
import { Knex } from 'knex';
import path from 'path';
import formatTitle from '@directus/format-title';
import env from '../../env';

type Migration = {
	version: string;
	name: string;
	timestamp: Date;
};

export default async function run(database: Knex, direction: 'up' | 'down' | 'latest') {
	let migrationFiles = await fse.readdir(__dirname);

	const customMigrationsPath = path.resolve(env.EXTENSIONS_PATH, 'migrations');
	let customMigrationFiles =
		((await fse.pathExists(customMigrationsPath)) && (await fse.readdir(customMigrationsPath))) || [];

	migrationFiles = migrationFiles.filter(
		(file: string) => file.startsWith('run') === false && file.endsWith('.d.ts') === false
	);
	customMigrationFiles = customMigrationFiles.filter((file: string) => file.endsWith('.js'));

	const completedMigrations = await database.select<Migration[]>('*').from('directus_migrations').orderBy('version');

	const migrations = [
		...migrationFiles.map((path) => parseFilePath(path)),
		...customMigrationFiles.map((path) => parseFilePath(path, true)),
	];

	function parseFilePath(filePath: string, custom: boolean = false) {
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

		const { up } = require(nextVersion.file);

		console.log(`✨ Applying ${nextVersion.name}...`);

		await up(database);
		await database.insert({ version: nextVersion.version, name: nextVersion.name }).into('directus_migrations');
	}

	async function down() {
		const currentVersion = completedMigrations[completedMigrations.length - 1];

		if (!currentVersion) {
			throw Error('Nothing to downgrade');
		}

		const migration = migrations.find((migration) => migration.version === currentVersion.version);

		if (!migration) {
			throw new Error("Couldn't find migration");
		}

		const { down } = require(migration.file);

		console.log(`✨ Undoing ${migration.name}...`);

		await down(database);
		await database('directus_migrations').delete().where({ version: migration.version });
	}

	async function latest() {
		for (const migration of migrations) {
			if (migration.completed === false) {
				const { up } = require(migration.file);

				console.log(`✨ Applying ${migration.name}...`);

				await up(database);
				await database.insert({ version: migration.version, name: migration.name }).into('directus_migrations');
			}
		}
	}
}
