import { drivers } from './drivers';
import { Credentials } from './install-db';
import { v4 as uuidv4 } from 'uuid';
import { nanoid } from 'nanoid';

const defaults = {
	general: {
		port: 3000,
		publicUrl: '/',
	},
	storage: {
		storageLocations: 'local',
		storageLocalPublicUrl: '/uploads',
		storageLocalDriver: 'local',
		storageLocalRoot: './uploads',
	},
	security: {
		uuid: uuidv4(),
		secret: nanoid(32),
		accessTokenTtl: '15m',
		refreshTokenTtl: '7d',
		refreshTokenCookieSecure: false,
		refreshTokenCookieSameSite: 'lax',
	},
	oauth: {
		oauthProviders: '',
	},
	extensions: {
		extensionsPath: './extensions',
	},
	email: {
		emailFrom: 'no-reply@directus.io',
		emailTransport: 'sendmail',
		emailSendmailNewLine: 'unix',
		emailSendmailPath: '/usr/sbin/sendmail',
	},
};

export default function createEnv(client: keyof typeof drivers, credentials: Credentials) {
	const config: Record<string, any> = {
		...defaults,
		database: {
			dbClient: client,
		},
	};

	for (const [key, value] of Object.entries(credentials)) {
		config.database[`db_${key}`] = value;
	}

	console.log(config);
}
