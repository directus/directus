import { isInstalled, validateMigrations } from '../database/index.js';
import { getExtensionManager } from '../extensions/index.js';
import { useLogger } from '../logger/index.js';

export const loadExtensions = async () => {
	const logger = useLogger();

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
