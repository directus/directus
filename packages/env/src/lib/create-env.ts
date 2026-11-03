import { readFileSync } from 'node:fs';
import { DEFAULTS } from '../constants/defaults.js';
import { DISABLEABLE_KEYS } from '../constants/type-map.js';
import type { Env } from '../types/env.js';
import { getConfigPath } from '../utils/get-config-path.js';
import { getDefaultType } from '../utils/get-default-type.js';
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
export const createEnv = (): Env => {
	const rawConfiguration = { ...readConfigurationFromProcess(), ...readConfigurationFromFile(getConfigPath()) };

	const output: Record<string, unknown> = {};

	for (const [rawKey, rawValue] of Object.entries(rawConfiguration)) {
		const [key, value] = resolveFileValue(rawKey, rawValue);
		const parsedValue = parseValue(key, value);

		if (parsedValue !== undefined) output[key] = parsedValue;
	}

	for (const [key, value] of Object.entries(DEFAULTS)) {
		if (output[key] !== undefined) continue;
		output[key] = getDefaultType(key) ? cast(value, key) : value;
	}

	return output as Env;
};

/**
 * Replaces `*_FILE` variables with the content of the file they point to, keeping the cast prefix if present
 */
function resolveFileValue(key: string, value: unknown): [string, unknown] {
	if (!isFileKey(key) || !isDirectusVariable(key) || typeof value !== 'string') return [key, value];

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
	if ((DISABLEABLE_KEYS as readonly string[]).includes(key) && (value === false || value === 'false' || value === '')) {
		return false;
	}

	// An empty value is treated as not configured, so the default applies
	if (value === '') return key in DEFAULTS ? undefined : cast(value, key);

	const castValue = cast(value, key);

	if (castValue === undefined || Number.isNaN(castValue)) {
		// eslint-disable-next-line no-console
		console.warn(`Environment variable "${key}" has an invalid value "${value}" and is ignored.`);
		return undefined;
	}

	return castValue;
}
