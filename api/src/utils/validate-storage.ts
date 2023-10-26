import { toArray } from '@directus/utils';
import { constants } from 'fs';
import { access } from 'node:fs/promises';
import path from 'path';
import env from '../env.js';
import { getExtensionsPath } from '../extensions/lib/get-extensions-path.js';
import logger from '../logger.js';

export async function validateStorage(): Promise<void> {
	if (env['DB_CLIENT'] === 'sqlite3') {
		try {
			await access(path.dirname(env['DB_FILENAME']), constants.R_OK | constants.W_OK);
		} catch {
			logger.warn(
				`Directory for SQLite database file (${path.resolve(path.dirname(env['DB_FILENAME']))}) is not read/writeable!`
			);
		}
	}

	const usedStorageDrivers = toArray(env['STORAGE_LOCATIONS']).map(
		(location) => env[`STORAGE_${location.toUpperCase()}_DRIVER`]
	);

	if (usedStorageDrivers.includes('local')) {
		try {
			await access(env['STORAGE_LOCAL_ROOT'], constants.R_OK | constants.W_OK);
		} catch {
			logger.warn(`Upload directory (${path.resolve(env['STORAGE_LOCAL_ROOT'])}) is not read/writeable!`);
		}
	}

	try {
		await access(getExtensionsPath(), constants.R_OK);
	} catch {
		logger.warn(`Extensions directory (${path.resolve(getExtensionsPath())}) is not readable!`);
	}
}
