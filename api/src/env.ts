/**
 * @NOTE
 * See example.env for all possible keys
 */

import fs from 'fs';
import path from 'path';
import { requireYAML } from './utils/require-yaml';

import dotenv from 'dotenv';
import { clone, toString, toNumber } from 'lodash';
import { toArray } from './utils/to-array';
import logger from './logger';

dotenv.config();

const defaults: Record<string, any> = {
	PORT: 8055,
	PUBLIC_URL: 'http://localhost:8055',

	STORAGE_LOCATIONS: 'local',
	STORAGE_LOCAL_PUBLIC_URL: 'http://localhost:8055/uploads',
	STORAGE_LOCAL_DRIVER: 'local',
	STORAGE_LOCAL_ROOT: './uploads',

	RATE_LIMITER_ENABLED: false,
	RATE_LIMITER_POINTS: 25,
	RATE_LIMITER_DURATION: 1,
	RATE_LIMITER_STORE: 'memory',

	ACCESS_TOKEN_TTL: '15m',
	REFRESH_TOKEN_TTL: '7d',
	REFRESH_TOKEN_COOKIE_SECURE: false,
	REFRESH_TOKEN_COOKIE_SAME_SITE: 'lax',

	CORS_ENABLED: true,

	CACHE_ENABLED: false,
	CACHE_STORE: 'memory',
	CACHE_TTL: '30m',
	CACHE_NAMESPACE: 'system-cache',
	CACHE_AUTO_PURGE: false,
	ASSETS_CACHE_TTL: '30m',

	OAUTH_PROVIDERS: '',

	EXTENSIONS_PATH: './extensions',

	EMAIL_FROM: 'no-reply@directus.io',
	EMAIL_TRANSPORT: 'sendmail',
	EMAIL_SENDMAIL_NEW_LINE: 'unix',
	EMAIL_SENDMAIL_PATH: '/usr/sbin/sendmail',

	TELEMETRY: true,
};

// Allows us to force certain environment variable into a type, instead of relying
// on the auto-parsed type in processValues. ref #3705
const typeMap: Record<string, string> = {
	PORT: 'number',

	DB_NAME: 'string',
	DB_USER: 'string',
	DB_PASSWORD: 'string',
	DB_DATABASE: 'string',
	DB_PORT: 'number',
};

const env: Record<string, any> = processValues({
	...defaults,
	...getEnv(),
});

export default env;

function getEnv() {
	if (!process.env.CONFIG_PATH) {
		return process.env;
	}

	const fileExt = path.extname(process.env.CONFIG_PATH).toLowerCase();

	if (fileExt === '.js') {
		const module = require(process.env.CONFIG_PATH);
		const exported = module.default || module;

		if (typeof exported === 'function') {
			return exported(process.env);
		} else if (typeof exported === 'object') {
			return exported;
		}

		logger.warn(
			`Invalid JS configuration file export type. Requires one of "function", "object", received: "${typeof exported}"`
		);
	}

	if (fileExt === '.json') {
		return require(process.env.CONFIG_PATH);
	}

	if (fileExt === '.yaml' || fileExt === '.yml') {
		const data = requireYAML(process.env.CONFIG_PATH);

		if (typeof data === 'object') {
			return data as Record<string, string>;
		}

		logger.warn('Invalid YAML configuration. Root has to ben an object.');
	}

	// Default to env vars plain text files
	return dotenv.parse(fs.readFileSync(process.env.CONFIG_PATH).toString());
}

function processValues(env: Record<string, any>) {
	env = clone(env);

	for (const [key, value] of Object.entries(env)) {
		if (typeMap[key]) {
			switch (typeMap[key]) {
				case 'number':
					env[key] = toNumber(value);
					break;
				case 'string':
					env[key] = toString(value);
					break;
				case 'array':
					env[key] = toArray(value);
					break;
			}

			continue;
		}

		if (value === 'true') env[key] = true;
		if (value === 'false') env[key] = false;
		if (value === 'null') env[key] = null;
		if (String(value).startsWith('0') === false && isNaN(value) === false && value.length > 0) env[key] = Number(value);
	}

	return env;
}
