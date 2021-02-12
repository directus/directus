/**
 * @NOTE
 * See example.env for all possible keys
 */

import * as fs from 'fs';
import * as path from 'path';
import yaml from 'js-yaml';

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

let env: Record<string, any> = {
	...defaults,
	...process.env,
};

env = processValues(env);

export default env;

function isJsFile(file: string): boolean {
	return path.extname(file).toLowerCase() === '.js';
}

function isJsonFile(file: string): boolean {
	return path.extname(file).toLowerCase() === '.json';
}

function isYamlFile(file: string): boolean {
	const ext = path.extname(file).toLowerCase();
	return ext === '.yml' || ext === '.yaml';
}

function loadCustomConfig(current: Record<string, string>): Record<string, string> {
	if (!current.CONFIG_PATH) {
		return {};
	}

	if (isJsFile(current.CONFIG_PATH)) {
		const module = require(current.CONFIG_PATH);
		const exported = module.default || module;
		if (typeof exported === 'function') {
			return exported(current);
		} else if (typeof exported === 'object') {
			return exported;
		}
		logger.warn('config js module detected but exports an incompatible type');
	} else if (isJsonFile(current.CONFIG_PATH)) {
		return require(current.CONFIG_PATH);
	} else if (isYamlFile(current.CONFIG_PATH)) {
		const data = yaml.safeLoad(fs.readFileSync(current.CONFIG_PATH).toString());
		if (typeof data === 'object') {
			return data as Record<string, string>;
		}
		logger.warn('config yaml detected but root is not an object');
	} else {
		// Fallback to .env
		return dotenv.parse(fs.readFileSync(current.CONFIG_PATH).toString());
	}

	return {};
}

function processValues(env: Record<string, any>) {
	env = clone(env);
	env = {
		...env,
		...loadCustomConfig(env),
	};

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
