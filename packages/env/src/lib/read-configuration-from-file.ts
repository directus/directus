import { getFileExtension } from '../utils/get-file-extension.js';
import { readConfigurationFromDotEnv } from '../utils/read-configuration-from-dotenv.js';
import { readConfigurationFromJavaScript } from '../utils/read-configuration-from-javascript.js';
import { readConfigurationFromJson } from '../utils/read-configuration-from-json.js';
import { readConfigurationFromYaml } from '../utils/read-configuration-from-yaml.js';
import { JAVASCRIPT_FILE_EXTS } from '@directus/constants';
import { isIn } from '@directus/utils';
import { existsSync } from 'node:fs';

/**
 * Read configuration variables from config file
 */
export const readConfigurationFromFile = (path: string) => {
	if (existsSync(path) === false) {
		return null;
	}

	const ext = getFileExtension(path);

	if (isIn(ext, JAVASCRIPT_FILE_EXTS)) {
		return readConfigurationFromJavaScript(path);
	}

	if (ext === 'json') {
		return readConfigurationFromJson(path);
	}

	if (isIn(ext, ['yaml', 'yml'] as const)) {
		return readConfigurationFromYaml(path);
	}

	return readConfigurationFromDotEnv(path);
};
