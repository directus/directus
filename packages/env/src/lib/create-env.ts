import { readFileSync } from 'node:fs';
import { DEFAULTS } from '../constants/defaults.js';
import type { Env } from '../types/env.js';
import { getConfigPath } from '../utils/get-config-path.js';
import { getTypeFromMap } from '../utils/get-type-from-map.js';
import { isDirectusVariable } from '../utils/is-directus-variable.js';
import { isFileKey } from '../utils/is-file-key.js';
import { readConfigurationFromProcess } from '../utils/read-configuration-from-process.js';
import { removeFileSuffix } from '../utils/remove-file-suffix.js';
import { cast } from './cast.js';
import { readConfigurationFromFile } from './read-configuration-from-file.js';

export const createEnv = (): Env => {
	const baseConfiguration = readConfigurationFromProcess();
	const fileConfiguration = readConfigurationFromFile(getConfigPath());

	const rawConfiguration = { ...baseConfiguration, ...fileConfiguration };

	const output: Env = {};

	for (const [key, value] of Object.entries(DEFAULTS)) {
		output[key] = getTypeFromMap(key) ? cast(value, key) : value;
	}

	for (let [key, value] of Object.entries(rawConfiguration)) {
		if (isFileKey(key) && isDirectusVariable(key) && typeof value === 'string') {
			try {
				value = readFileSync(value, { encoding: 'utf8' });
				key = removeFileSuffix(key);
			} catch {
				throw new Error(`Failed to read value from file "${value}", defined in environment variable "${key}".`);
			}
		}

		output[key] = cast(value, key);
	}

	return output;
};
