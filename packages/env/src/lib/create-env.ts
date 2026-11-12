import { readFileSync } from 'node:fs';
import { DEFAULTS } from '../constants/defaults.js';
import type { Env } from '../types/env.js';
import { getConfigPath } from '../utils/get-config-path.js';
import { getDefaultType, getTypeMapEntry } from '../utils/get-type-map-entry.js';
import { getCastFlag } from '../utils/has-cast-prefix.js';
import { isDirectusVariable } from '../utils/is-directus-variable.js';
import { isFileKey } from '../utils/is-file-key.js';
import { readConfigurationFromProcess } from '../utils/read-configuration-from-process.js';
import { removeFileSuffix } from '../utils/remove-file-suffix.js';
import { cast } from './cast.js';
import { readConfigurationFromFile } from './read-configuration-from-file.js';

/**
 * Loads the environment variables from the process and the env file.
 */
export function createEnv(): Env {
	const rawConfiguration = { ...readConfigurationFromProcess(), ...readConfigurationFromFile(getConfigPath()) };

	const output: Record<string, unknown> = {};

	for (const [rawKey, rawValue] of Object.entries(rawConfiguration)) {
		const [key, value] = isDirectusVariable(rawKey) ? resolveFileValue(rawKey, rawValue) : [rawKey, rawValue];
		const parsedValue = parseValue(key, value);

		if (parsedValue !== undefined) output[key] = parsedValue;
	}

	for (const [key, value] of Object.entries(DEFAULTS)) {
		if (output[key] !== undefined) continue;
		output[key] = getDefaultType(key) ? cast(value, key) : value;
	}

	const flowEnvAllowList = output['FLOWS_ENV_ALLOW_LIST'];

	if (Array.isArray(flowEnvAllowList)) {
		for (const [rawKey, rawValue] of Object.entries(rawConfiguration)) {
			if (!isFileKey(rawKey) || isDirectusVariable(rawKey) || typeof rawValue !== 'string') continue;
			if (!flowEnvAllowList.includes(removeFileSuffix(rawKey))) continue;

			const [key, value] = resolveFileValue(rawKey, rawValue);
			const parsedValue = parseValue(key, value);

			if (parsedValue !== undefined) output[key] = parsedValue;
			else delete output[key];

			delete output[rawKey];
		}
	}

	return output as Env;
}

/**
 * Replaces `*_FILE` variables with the content of the file they point to, keeping the cast prefix if present
 */
function resolveFileValue(key: string, value: unknown): [string, unknown] {
	if (!isFileKey(key) || typeof value !== 'string') return [key, value];

	const castFlag = getCastFlag(value);
	const castPrefix = castFlag ? castFlag + ':' : '';
	const filePath = castFlag ? value.replace(castPrefix, '') : value;

	try {
		return [removeFileSuffix(key), castPrefix + readFileSync(filePath, { encoding: 'utf8' })];
	} catch {
		throw new Error(`Failed to read value from file "${value}", defined in environment variable "${key}".`);
	}
}

/**
 * Casts a configured value. Returns `undefined` for values that should fall back to the default
 */
function parseValue(key: string, value: unknown): unknown {
	const entry = getTypeMapEntry(key);

	const isDisableable = Array.isArray(entry) && entry.includes('false');

	if (isDisableable && (value === false || value === 'false' || value === '')) {
		return false;
	}

	if (value === '') {
		const type = getDefaultType(key);

		// An empty string or list is a meaningful value, eg an empty password. Variables that should be treated as not
		// configured are left out entirely (`KEY=` in a .env file)
		if (type === 'string' || type === 'array' || type === 'string-array') return cast(value, key);

		// For other known variables, an empty value is treated as not configured so that the default applies (or the
		// variable is left out), instead of being cast to eg `0`. Unknown variables keep the empty string as-is
		return type !== null || key in DEFAULTS ? undefined : value;
	}

	const castValue = cast(value, key);

	if (castValue === undefined || Number.isNaN(castValue)) {
		// eslint-disable-next-line no-console
		console.warn(`Environment variable "${key}" has an invalid value "${value}" and is ignored.`);

		// Invalid booleans fall back to the default, or `false` if there is none
		if (getDefaultType(key) === 'boolean' && !(key in DEFAULTS)) return false;

		return undefined;
	}

	return castValue;
}
