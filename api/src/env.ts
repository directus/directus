/**
 * @NOTE
 * See example.env for all possible keys
 */

import dotenv from 'dotenv';
import fs from 'fs';
import { clone, toNumber, toString } from 'lodash';
import path from 'path';
import { requireYAML } from './utils/require-yaml';
import { toArray } from '@directus/shared/utils';

const acceptedEnvTypes = ['string', 'number', 'regex', 'array'];

const defaults: Record<string, any> = {
	CONFIG_PATH: path.resolve(process.cwd(), '.env'),

	HOST: '0.0.0.0',
	PORT: 8055,
	PUBLIC_URL: '/',
	MAX_PAYLOAD_SIZE: '100kb',

	DB_EXCLUDE_TABLES: 'spatial_ref_sys,sysdiagrams',

	STORAGE_LOCATIONS: 'local',
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
	REFRESH_TOKEN_COOKIE_NAME: 'directus_refresh_token',

	ROOT_REDIRECT: './admin',

	CORS_ENABLED: false,
	CORS_ORIGIN: false,
	CORS_METHODS: 'GET,POST,PATCH,DELETE',
	CORS_ALLOWED_HEADERS: 'Content-Type,Authorization',
	CORS_EXPOSED_HEADERS: 'Content-Range',
	CORS_CREDENTIALS: true,
	CORS_MAX_AGE: 18000,

	CACHE_ENABLED: false,
	CACHE_STORE: 'memory',
	CACHE_TTL: '5m',
	CACHE_NAMESPACE: 'system-cache',
	CACHE_AUTO_PURGE: false,
	CACHE_CONTROL_S_MAXAGE: '0',
	CACHE_SCHEMA: true,
	CACHE_PERMISSIONS: true,

	AUTH_PROVIDERS: '',
	AUTH_DISABLE_DEFAULT: false,

	EXTENSIONS_PATH: './extensions',
	EXTENSIONS_AUTO_RELOAD: false,

	EMAIL_FROM: 'no-reply@directus.io',
	EMAIL_TRANSPORT: 'sendmail',
	EMAIL_SENDMAIL_NEW_LINE: 'unix',
	EMAIL_SENDMAIL_PATH: '/usr/sbin/sendmail',

	TELEMETRY: true,

	ASSETS_CACHE_TTL: '30d',
	ASSETS_TRANSFORM_MAX_CONCURRENT: 1,
	ASSETS_TRANSFORM_IMAGE_MAX_DIMENSION: 6000,
	ASSETS_TRANSFORM_MAX_OPERATIONS: 5,

	IP_TRUST_PROXY: true,
	IP_CUSTOM_HEADER: false,

	SERVE_APP: true,

	RELATIONAL_BATCH_SIZE: 25000,
};

// Allows us to force certain environment variable into a type, instead of relying
// on the auto-parsed type in processValues. ref #3705
const typeMap: Record<string, string> = {
	HOST: 'string',
	PORT: 'string',

	DB_NAME: 'string',
	DB_USER: 'string',
	DB_PASSWORD: 'string',
	DB_DATABASE: 'string',
	DB_PORT: 'number',

	DB_EXCLUDE_TABLES: 'array',
};

let env: Record<string, any> = {
	...defaults,
	...getEnv(),
	...process.env,
};

process.env = env;

env = processValues(env);

export default env;

/**
 * When changes have been made during runtime, like in the CLI, we can refresh the env object with
 * the newly created variables
 */
export function refreshEnv(): void {
	env = {
		...defaults,
		...getEnv(),
		...process.env,
	};

	process.env = env;

	env = processValues(env);
}

function getEnv() {
	const configPath = path.resolve(process.env.CONFIG_PATH || defaults.CONFIG_PATH);

	if (fs.existsSync(configPath) === false) return {};

	const fileExt = path.extname(configPath).toLowerCase();

	if (fileExt === '.js') {
		const module = require(configPath);
		const exported = module.default || module;

		if (typeof exported === 'function') {
			return exported(process.env);
		} else if (typeof exported === 'object') {
			return exported;
		}

		throw new Error(
			`Invalid JS configuration file export type. Requires one of "function", "object", received: "${typeof exported}"`
		);
	}

	if (fileExt === '.json') {
		return require(configPath);
	}

	if (fileExt === '.yaml' || fileExt === '.yml') {
		const data = requireYAML(configPath);

		if (typeof data === 'object') {
			return data as Record<string, string>;
		}

		throw new Error('Invalid YAML configuration. Root has to be an object.');
	}

	// Default to env vars plain text files
	return dotenv.parse(fs.readFileSync(configPath, { encoding: 'utf8' }));
}

function getVariableType(variable: string) {
	return variable.split(':').slice(0, -1)[0];
}

function getEnvVariableValue(variableValue: string, variableType: string) {
	return variableValue.split(`${variableType}:`)[1];
}

function getEnvironmentValueWithPrefix(envArray: Array<string>): Array<string | number | RegExp> {
	return envArray.map((item: string) => {
		if (isEnvSyntaxPrefixPresent(item)) {
			return getEnvironmentValueByType(item);
		}
		return item;
	});
}

function getEnvironmentValueByType(envVariableString: string) {
	const variableType = getVariableType(envVariableString);
	const envVariableValue = getEnvVariableValue(envVariableString, variableType);

	switch (variableType) {
		case 'number':
			return toNumber(envVariableValue);
		case 'array':
			return getEnvironmentValueWithPrefix(toArray(envVariableValue));
		case 'regex':
			return new RegExp(envVariableValue);
		case 'string':
			return envVariableValue;
		case 'json':
			return tryJSON(envVariableValue);
	}
}

function isEnvSyntaxPrefixPresent(value: string): boolean {
	return acceptedEnvTypes.some((envType) => value.includes(`${envType}:`));
}

function processValues(env: Record<string, any>) {
	env = clone(env);

	for (let [key, value] of Object.entries(env)) {
		// If key ends with '_FILE', try to get the value from the file defined in this variable
		// and store it in the variable with the same name but without '_FILE' at the end
		let newKey;
		if (key.length > 5 && key.endsWith('_FILE')) {
			newKey = key.slice(0, -5);
			if (newKey in env) {
				throw new Error(
					`Duplicate environment variable encountered: you can't use "${newKey}" and "${key}" simultaneously.`
				);
			}
			try {
				value = fs.readFileSync(value, { encoding: 'utf8' });
				key = newKey;
			} catch {
				throw new Error(`Failed to read value from file "${value}", defined in environment variable "${key}".`);
			}
		}

		// Convert values with a type prefix
		// (see https://docs.directus.io/reference/environment-variables/#environment-syntax-prefix)
		if (typeof value === 'string' && isEnvSyntaxPrefixPresent(value)) {
			env[key] = getEnvironmentValueByType(value);
			continue;
		}

		// Convert values where the key is defined in typeMap
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
				case 'json':
					env[key] = tryJSON(value);
					break;
			}
			continue;
		}

		// Try to convert remaining values:
		// - boolean values to boolean
		// - 'null' to null
		// - number values (> 0 <= Number.MAX_SAFE_INTEGER) to number
		if (value === 'true') {
			env[key] = true;
			continue;
		}

		if (value === 'false') {
			env[key] = false;
			continue;
		}

		if (value === 'null') {
			env[key] = null;
			continue;
		}

		if (
			String(value).startsWith('0') === false &&
			isNaN(value) === false &&
			value.length > 0 &&
			value <= Number.MAX_SAFE_INTEGER
		) {
			env[key] = Number(value);
			continue;
		}

		if (String(value).includes(',')) {
			env[key] = toArray(value);
		}

		// Try converting the value to a JS object. This allows JSON objects to be passed for nested
		// config flags, or custom param names (that aren't camelCased)
		env[key] = tryJSON(value);

		// If '_FILE' variable hasn't been processed yet, store it as it is (string)
		if (newKey) {
			env[key] = value;
		}
	}

	return env;
}

function tryJSON(value: any) {
	try {
		return JSON.parse(value);
	} catch {
		return value;
	}
}
