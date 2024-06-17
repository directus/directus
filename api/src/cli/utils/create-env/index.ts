import fs from 'fs';
import { Liquid } from 'liquidjs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import path from 'path';
import { promisify } from 'util';
import type { Credentials } from '../create-db-connection.js';
import type { drivers } from '../drivers.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const fchmod = promisify(fs.fchmod);
const open = promisify(fs.open);

const liquidEngine = new Liquid({
	extname: '.liquid',
});

export default async function createEnv(
	client: keyof typeof drivers,
	credentials: Credentials,
	directory: string,
): Promise<void> {
	const { nanoid } = await import('nanoid');

	const config: Record<string, any> = {
		security: {
			SECRET: nanoid(32),
		},
		database: {
			DB_CLIENT: client,
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

	const templateString = await readFile(path.join(__dirname, 'env-stub.liquid'), 'utf8');
	const text = await liquidEngine.parseAndRender(templateString, configAsStrings);
	await writeFile(path.join(directory, '.env'), text);
	await fchmod(await open(path.join(directory, '.env'), 'r+'), 0o640);
}
