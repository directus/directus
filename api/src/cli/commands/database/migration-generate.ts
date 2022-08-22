import { existsSync, mkdirSync, copyFileSync } from 'fs';
import * as path from 'path';
import env from '../../../env';
import logger from '../../../logger';
import fse from 'fs-extra';

const migrationPath = path.resolve(env.EXTENSIONS_PATH, 'migrations');

if (!existsSync(migrationPath)) {
	mkdirSync(migrationPath);
}

function padNumberWithOneZero(number: number): string {
	return number.toString().padStart(2, '0');
}

function formatYYYYMMDD(date: Date): string {
	return `${padNumberWithOneZero(date.getUTCFullYear())}${padNumberWithOneZero(
		date.getUTCMonth() + 1
	)}${padNumberWithOneZero(date.getUTCDate())}`;
}

async function getNextCharVersion(yyyymmdd: string): Promise<string> {
	let currentDaysMigrationFiles = await fse.readdir(migrationPath);

	currentDaysMigrationFiles = currentDaysMigrationFiles.filter((file: string) => {
		return new RegExp(`^${yyyymmdd}[A-Z]-[^.]+\\.js$`, 'i').test(file);
	});

	let nextCharVersion = 'A';
	if (currentDaysMigrationFiles.length > 0) {
		const latestMigrationFilePrefix = currentDaysMigrationFiles.reverse()[0].split('-', 1)[0];
		nextCharVersion = String.fromCharCode(
			latestMigrationFilePrefix.charCodeAt(latestMigrationFilePrefix.length - 1) + 1
		);
	}
	return nextCharVersion;
}

async function generateMigrationFileName(migrationName: string): Promise<string> {
	const migrationPrefix = formatYYYYMMDD(new Date(Date.now()));
	const nextCharVersion = await getNextCharVersion(migrationPrefix);

	return `${migrationPrefix}${nextCharVersion}-${migrationName}.js`;
}

function standardizeMigrationName(migrationName: string) {
	let formattedMigrationName = path.parse(migrationName).name;
	formattedMigrationName = formattedMigrationName.replace('_', '-');
	return formattedMigrationName;
}

export default async function start(migrationName: string) {
	const migrationFileName = await generateMigrationFileName(standardizeMigrationName(migrationName));
	copyFileSync(
		path.resolve(path.dirname(__dirname), 'templates/migration.js'),
		`${migrationPath}/${migrationFileName}`
	);
	logger.info(`Migration file generated: ${migrationFileName}`);
}
