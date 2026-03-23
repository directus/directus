import { readFileSync } from 'node:fs';
import { DEFAULTS } from '../constants/defaults.js';
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

export const createEnv = (): Env => {
	const baseConfiguration = readConfigurationFromProcess();
	const fileConfiguration = readConfigurationFromFile(getConfigPath());

	const rawConfiguration = { ...baseConfiguration, ...fileConfiguration };

	const output: Env = {};

	for (const [key, value] of Object.entries(DEFAULTS)) {
		output[key] = getDefaultType(key) ? cast(value, key) : value;
	}

	for (let [key, value] of Object.entries(rawConfiguration)) {
		if (isFileKey(key) && isDirectusVariable(key) && typeof value === 'string') {
			try {
				// get the path to the file
				const castFlag = getCastFlag(value);
				const castPrefix = castFlag ? castFlag + ':' : '';
				const filePath = castFlag ? value.replace(castPrefix, '') : value;

				// read file content
				const fileContent = readFileSync(filePath, { encoding: 'utf8' });

				// override key value pair
				key = removeFileSuffix(key);
				value = castPrefix + fileContent;
			} catch {
				throw new Error(`Failed to read value from file "${value}", defined in environment variable "${key}".`);
			}
		}

		output[key] = cast(value, key);
	}

	return output;
};
