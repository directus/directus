/* eslint-disable no-console */

/*
 * I don't see a need for run.down()
 * but I figure I have it so I'll leave it.
 */

import { Knex } from 'knex';
import path from 'path';
import fse from 'fs-extra';
import { orderBy } from 'lodash';

export type Migration = {
	version: string;
	name: string;
	timestamp: Date;
};

export default async function migrate(
	vendor: string,
	database: Knex<any, unknown>,
	direction: 'latest' | 'up' | 'down'
): Promise<void> {
	try {
		// TODO replace this with something the darn cli package will format
		console.log(`${vendor}: Running migrations...`);

		await run(database, direction, vendor);

		if (direction === 'down') {
			// TODO replace this with something the darn cli package will format
			console.log(`${vendor}: Downgrade successful`);
		} else {
			// TODO replace this with something the darn cli package will format
			console.log(`${vendor}: Database up to date`);
		}
		database.destroy();
	} catch (err: any) {
		// TODO replace this with something the darn cli package will format
		console.error(err);
		database.destroy();
		process.exit(1);
	}
}

export async function run(database: Knex, direction: 'up' | 'down' | 'latest', vendor: string): Promise<void> {
	let migrationFiles = await fse.readdir(__dirname);

	migrationFiles = migrationFiles.filter(
		(file: string) => file.startsWith('run') === false && file.endsWith('.d.ts') === false
	);

	const completedMigrations = await database.select<Migration[]>('*').from('directus_migrations').orderBy('version');

	const migrations = [...migrationFiles.map((path) => parseFilePath(path))];

	const migrationKeys = new Set(migrations.map((m) => m.version));
	if (migrations.length > migrationKeys.size) {
		throw new Error(`${vendor}: Migration keys collide! Please ensure that every migration uses a unique key.`);
	}

	function parseFilePath(filePath: string) {
		const version = filePath.split('-')[0];
		const name = filePath.split('-').slice(1).join('_').split('.')[0];
		const completed = !!completedMigrations.find((migration) => migration.version === version);

		return {
			file: path.join(__dirname, filePath),
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
				// TODO do I really want to ! version? seems risky but I was sick of the red squiggly
				return migration.version! > currentVersion.version && migration.completed === false;
			});
		}
		if (!nextVersion) {
			throw Error('Nothing to upgrade');
		}

		const { up } = require(nextVersion.file);

		// TODO replace this with something the darn cli package will format
		console.log(`${vendor}: Applying ${nextVersion.name}...`);

		await up(database);
		await database.insert({ version: nextVersion.version, name: nextVersion.name }).into('directus_migrations');
	}

	async function down() {
		const lastAppliedMigration = orderBy(completedMigrations, ['timestamp'], ['desc'])[0];

		if (!lastAppliedMigration) {
			throw Error('Nothing to downgrade');
		}

		const migration = migrations.find((migration) => migration.version === lastAppliedMigration.version);

		if (!migration) {
			throw new Error("Couldn't find migration");
		}

		const { down } = require(migration.file);

		// TODO replace this with something the darn cli package will format
		console.log(`Undoing ${migration.name}...`);

		await down(database);
		await database('directus_migrations').delete().where({ version: migration.version });
	}

	async function latest() {
		for (const migration of migrations) {
			if (migration.completed === false) {
				const { up } = require(migration.file);

				// TODO replace this with something the darn cli package will format
				console.log(`Applying ${migration.name}...`);

				await up(database);
				await database.insert({ version: migration.version, name: migration.name }).into('directus_migrations');
			}
		}
	}
}
