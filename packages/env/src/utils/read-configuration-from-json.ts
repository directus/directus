import { isPlainObject } from 'lodash-es';
import { createRequire } from 'node:module';

export const readConfigurationFromJson = (path: string) => {
	const require = createRequire(import.meta.url);

	const config = require(path);

	if (isPlainObject(config) === false) {
		throw new Error('JSON configuration file does not contain an object');
	}

	return config as Record<string, unknown>;
};
