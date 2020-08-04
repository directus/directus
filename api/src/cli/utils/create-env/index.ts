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

const liquidEngine = new Liquid({
	extname: '.liquid',
});

const defaults = {
	general: {
		PORT: 41201,
		PUBLIC_URL: '/',
	},
	storage: {
		STORAGE_LOCATIONS: 'local',
		STORAGE_LOCAL_PUBLIC_URL: '/uploads',
		STORAGE_LOCAL_DRIVER: 'local',
		STORAGE_LOCAL_ROOT: './uploads',
	},
	security: {
		KEY: uuidv4(),
		SECRET: nanoid(32),
		ACCESS_TOKEN_TTL: '15m',
		REFRESH_TOKEN_TTL: '7d',
		REFRESH_TOKEN_COOKIE_SECURE: false,
		REFRESH_TOKEN_COOKIE_SAME_SITE: 'lax',
	},
	oauth: {
		OAUTH_PROVIDERS: '',
	},
	extensions: {
		EXTENSIONS_PATH: './extensions',
	},
	email: {
		EMAIL_FROM: 'no-reply@directus.io',
		EMAIL_TRANSPORT: 'sendmail',
		EMAIL_SENDMAIL_NEW_LINE: 'unix',
		EMAIL_SENDMAIL_PATH: '/usr/sbin/sendmail',
	},
};

export default async function createEnv(
	client: keyof typeof drivers,
	credentials: Credentials,
	directory: string
) {
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
}
