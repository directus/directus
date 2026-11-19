import { chmod, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { Driver } from '@directus/types';
import { Liquid } from 'liquidjs';
import type { Credentials } from '../create-db-connection.js';

const liquidEngine = new Liquid({
	extname: '.liquid',
});

export default async function createEnv(client: Driver, credentials: Credentials, directory: string): Promise<void> {
	const { nanoid } = await import('nanoid');

	// For backwards-compatibility, DB_CLIENT is still 'mysql'
	const dbClient = client === 'mysql2' ? 'mysql' : client;

	const config: Record<string, any> = {
		security: {
			SECRET: nanoid(32),
		},
		database: {
			DB_CLIENT: dbClient,
		},
	};

	for (const [key, value] of Object.entries(credentials)) {
		config['database'][`DB_${key.toUpperCase()}`] = value;
	}

	const configAsStrings: any = {};

	for (const [key, value] of Object.entries(config)) {
		configAsStrings[key] = '';

		for (const [envKey, envValue] of Object.entries(value)) {
			configAsStrings[key] += `${envKey}="${envValue}"\n`;
		}
	}

	const templateString = await readFile(path.join(import.meta.dirname, 'env-stub.liquid'), 'utf8');
	const text = await liquidEngine.parseAndRender(templateString, configAsStrings);
	const envPath = path.join(directory, '.env');

	await writeFile(envPath, text);
	await chmod(envPath, 0o640);
}
