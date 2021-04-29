import { drivers } from '../drivers';
import { Credentials } from '../create-db-connection';
import { v4 as uuidv4 } from 'uuid';
import { nanoid } from 'nanoid';
import { Liquid } from 'liquidjs';
import fs from 'fs';
import { promisify } from 'util';
import path from 'path';

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const fchmod = promisify(fs.fchmod);
const open = promisify(fs.open);

const liquidEngine = new Liquid({
	extname: '.liquid',
});

const defaults = {
	security: {
		KEY: uuidv4(),
		SECRET: nanoid(32),
	},
};

export default async function createEnv(
	client: keyof typeof drivers,
	credentials: Credentials,
	directory: string
): Promise<void> {
	const config: Record<string, any> = {
		...defaults,
		database: {
			DB_CLIENT: client,
		},
	};

	for (const [key, value] of Object.entries(credentials)) {
		config.database[`DB_${key.toUpperCase()}`] = value;
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
