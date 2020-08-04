import dotenv from 'dotenv';
import logger from './logger';

dotenv.config();

const defaults: Record<string, any> = {
	PORT: 41201,
	PUBLIC_URL: 'http://localhost:41201',

	STORAGE_LOCATIONS: 'local',
	STORAGE_LOCAL_PUBLIC_URL: 'http://localhost:41201/uploads',
	STORAGE_LOCAL_DRIVER: 'local',
	STORAGE_LOCAL_ROOT: './uploads',

	ACCESS_TOKEN_TTL: '15m',
	REFRESH_TOKEN_TTL: '7d',
	REFRESH_TOKEN_COOKIE_SECURE: false,
	REFRESH_TOKEN_COOKIE_SAME_SITE: 'lax',

	CORS_ENABLED: false,

	OAUTH_PROVIDERS: '',

	EXTENSIONS_PATH: './extensions',

	EMAIL_FROM: 'no-reply@directus.io',
	EMAIL_TRANSPORT: 'sendmail',
	EMAIL_SENDMAIL_NEW_LINE: 'unix',
	EMAIL_SENDMAIL_PATH: '/usr/sbin/sendmail',
};

const env: Record<string, any> = {
	...defaults,
	...process.env,
};

export default env;

export function validateEnv() {
	const requiredKeys = ['DB_CLIENT', 'KEY', 'SECRET'];

	if (env.DB_CLIENT && env.DB_CLIENT === 'sqlite3') {
		requiredKeys.push('DB_FILENAME');
	} else {
		requiredKeys.push('DB_HOST', 'DB_PORT', 'DB_DATABASE', 'DB_USER', 'DB_PASSWORD');
	}

	for (const requiredKey of requiredKeys) {
		if (env.hasOwnProperty(requiredKey) === false) {
			logger.fatal(`Environment is missing the ${requiredKey} key.`);
			process.exit(1);
		}
	}
}

/**
 * @NOTE
 * See example.env for all possible keys
 */
