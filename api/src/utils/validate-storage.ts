import env from '../env';
import logger from '../logger';
import { access } from 'fs-extra';
import { constants } from 'fs';
import path from 'path';

export async function validateStorage(): Promise<void> {
	if (env.DB_CLIENT === 'sqlite3') {
		try {
			await access(path.dirname(env.DB_FILENAME), constants.R_OK | constants.W_OK);
		} catch {
			logger.warn(
				`Directory for SQLite database file (${path.resolve(path.dirname(env.DB_FILENAME))}) is not read/writeable!`
			);
		}
	}

	if (env.STORAGE_LOCATIONS.split(',').includes('local')) {
		try {
			await access(env.STORAGE_LOCAL_ROOT, constants.R_OK | constants.W_OK);
		} catch {
			logger.warn(`Upload directory (${path.resolve(env.STORAGE_LOCAL_ROOT)}) is not read/writeable!`);
		}
	}

	try {
		await access(env.EXTENSIONS_PATH, constants.R_OK);
	} catch {
		logger.warn(`Extensions directory (${path.resolve(env.EXTENSIONS_PATH)}) is not readable!`);
	}
}
