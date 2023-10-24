import { isInstalled, validateMigrations } from '../database/index.js';
import { getEnv } from '../env.js';
import { getExtensionManager } from '../extensions/index.js';
import logger from '../logger.js';

export const loadExtensions = async () => {
	const env = getEnv();

	if (!('DB_CLIENT' in env)) return;

	const installed = await isInstalled();

	if (!installed) return;

	try {
		await validateMigrations();
	} catch {
		logger.info('Database is out of date. Skipping CLI extensions initialization.');
		return;
	}

	const extensionManager = getExtensionManager();
	await extensionManager.initialize({ schedule: false, watch: false });
};
