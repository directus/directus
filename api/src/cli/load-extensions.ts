import { isInstalled, validateMigrations } from '../database/index.js';
import { getExtensionManager } from '../extensions/index.js';
import { useLogger } from '../logger/index.js';
import { useEnv } from '@directus/env';

export const loadExtensions = async () => {
	const env = useEnv();
	const logger = useLogger();

	if (!('DB_CLIENT' in env)) return;

	const installed = await isInstalled();

	if (!installed) return;

	const migrationsValid = await validateMigrations();

	if (!migrationsValid) {
		logger.info('Skipping CLI extensions initialization due to outstanding migrations.');
		return;
	}

	const extensionManager = getExtensionManager();
	await extensionManager.initialize({ schedule: false, watch: false });
};
