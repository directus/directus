import formatTitle from '@directus/format-title';
import fse from 'fs-extra';
import type { Knex } from 'knex';
import { orderBy } from 'lodash-es';
import path from 'node:path';
import { flushCaches } from '../../cache.js';
import env from '../../env.js';
import logger from '../../logger.js';
import type { Migration } from '../../types/index.js';
import getModuleDefault from '../../utils/get-module-default.js';
import * as internalMigrations from './index.js';

export default async function run(database: Knex, direction: 'up' | 'down' | 'latest', log = true): Promise<void> {
	const customMigrationsPath = path.resolve(env['EXTENSIONS_PATH'], 'migrations');

	let customMigrationFiles =
		((await fse.pathExists(customMigrationsPath)) && (await fse.readdir(customMigrationsPath))) || [];

	customMigrationFiles = customMigrationFiles.filter((file: string) => file.includes('-') && /\.(c|m)?js$/.test(file));

	const completedMigrations = await database.select<Migration[]>('*').from('directus_migrations').orderBy('version');

	const migrations = [
		...Object.keys(internalMigrations).map((file) => parseFileName(file)),
		...customMigrationFiles.map((file) => parseFileName(file, true)),
	].sort((a, b) => (a.version! > b.version! ? 1 : -1));

	const migrationKeys = new Set(migrations.map((m) => m.version));

	if (migrations.length > migrationKeys.size) {
		throw new Error('Migration keys collide! Please ensure that every migration uses a unique key.');
	}

	function parseFileName(file: string, custom = false) {
		const fileName = custom ? file : file.substring(10).replaceAll('_', '-');

		const version = fileName.split('-')[0];
		const name = formatTitle(fileName.split('-').slice(1).join('_').split('.')[0]!);
		const completed = !!completedMigrations.find((migration) => migration.version === version);

		return {
			// @ts-ignore
			...(!custom && { content: internalMigrations[file] }),
			...(custom && { file: path.join(customMigrationsPath, file) }),
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
				return migration.version! > currentVersion.version && migration.completed === false;
			});
		}

		if (!nextVersion) {
			throw Error('Nothing to upgrade');
		}

		const { up } = nextVersion.content || (await import(`file://${nextVersion.file}`));

		if (!up) {
			logger.warn(`Couldn't find the "up" function from migration ${nextVersion.file}`);
		}

		if (log) {
			logger.info(`Applying ${nextVersion.name}...`);
		}

		await up(database);
		await database.insert({ version: nextVersion.version, name: nextVersion.name }).into('directus_migrations');

		await flushCaches(true);
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

		const { down } = migration.content || (await import(`file://${migration.file}`));

		if (!down) {
			logger.warn(`Couldn't find the "down" function from migration ${migration.file}`);
		}

		if (log) {
			logger.info(`Undoing ${migration.name}...`);
		}

		await down(database);
		await database('directus_migrations').delete().where({ version: migration.version });

		await flushCaches(true);
	}

	async function latest() {
		let needsCacheFlush = false;

		for (const migration of migrations) {
			if (migration.completed === false) {
				needsCacheFlush = true;
				const { up } = migration.content || getModuleDefault(await import(`file://${migration.file}`));

				if (!up) {
					logger.warn(`Couldn't find the "up" function from migration ${migration.file}`);
				}

				if (log) {
					logger.info(`Applying ${migration.name}...`);
				}

				await up(database);
				await database.insert({ version: migration.version, name: migration.name }).into('directus_migrations');
			}
		}

		if (needsCacheFlush) {
			await flushCaches(true);
		}
	}
}
