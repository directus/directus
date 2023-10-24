import { isInstalled, validateMigrations } from '../database/index.js';
import { getEnv } from '../env.js';
import { getExtensionManager } from '../extensions/index.js';

export const loadExtensions = async () => {
	const env = getEnv();

	if (!('DB_CLIENT' in env)) return;

	const installed = await isInstalled();

	if (!installed) return;

	try {
		await validateMigrations();
	} catch {
		return;
	}

	const extensionManager = getExtensionManager();
	await extensionManager.initialize({ schedule: false, watch: false });
};
