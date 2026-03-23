import { constants } from 'fs';
import { access } from 'node:fs/promises';
import path from 'path';
import { useEnv } from '@directus/env';
import { toArray } from '@directus/utils';
import { getExtensionsPath } from '../extensions/lib/get-extensions-path.js';
import { useLogger } from '../logger/index.js';

export async function validateStorage(): Promise<void> {
	const env = useEnv();
	const logger = useLogger();

	if (env['DB_CLIENT'] === 'sqlite3') {
		try {
			await access(path.dirname(env['DB_FILENAME'] as string), constants.R_OK | constants.W_OK);
		} catch {
			logger.warn(
				`Directory for SQLite database file (${path.resolve(
					path.dirname(env['DB_FILENAME'] as string),
				)}) is not read/writeable!`,
			);
		}
	}

	const usedStorageDrivers = toArray(env['STORAGE_LOCATIONS'] as string).map(
		(location) => env[`STORAGE_${location.toUpperCase()}_DRIVER`],
	);

	if (usedStorageDrivers.includes('local')) {
		try {
			await access(env['STORAGE_LOCAL_ROOT'] as string, constants.R_OK | constants.W_OK);
		} catch {
			logger.warn(`Upload directory (${path.resolve(env['STORAGE_LOCAL_ROOT'] as string)}) is not read/writeable!`);
		}
	}

	if (!env['EXTENSIONS_LOCATION']) {
		try {
			await access(getExtensionsPath(), constants.R_OK);
		} catch {
			logger.warn(`Extensions directory (${path.resolve(getExtensionsPath())}) is not readable!`);
		}
	}
}
