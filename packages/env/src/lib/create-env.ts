import { readFileSync } from 'node:fs';
import { toArray } from '@directus/utils';
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
			value = readFileValue(key, value);
			key = removeFileSuffix(key);
		}

		output[key] = cast(value, key);
	}

	const flowEnvAllowList = output['FLOWS_ENV_ALLOW_LIST'] ? toArray(output['FLOWS_ENV_ALLOW_LIST']) : [];

	for (const [key, value] of Object.entries(rawConfiguration)) {
		if (!isFileKey(key) || isDirectusVariable(key) || typeof value !== 'string') continue;

		const name = removeFileSuffix(key);

		if (!flowEnvAllowList.includes(name)) continue;

		output[name] = cast(readFileValue(key, value), name);
		delete output[key];
	}

	return output;
};

function readFileValue(key: string, value: string): string {
	try {
		const castFlag = getCastFlag(value);
		const castPrefix = castFlag ? castFlag + ':' : '';
		const filePath = castFlag ? value.slice(castPrefix.length) : value;
		const fileContent = readFileSync(filePath, { encoding: 'utf8' });

		return castPrefix + fileContent;
	} catch {
		throw new Error(`Failed to read value from file "${value}", defined in environment variable "${key}".`);
	}
}
