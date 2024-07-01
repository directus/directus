import { getConfigFromEnv } from '../../../utils/get-config-from-env.js';

export function getDriverConfig(location: string): { driver: string; options: Record<string, unknown> } {
	const driverConfig = getConfigFromEnv(`STORAGE_${location.trim().toUpperCase()}_`);

	const { driver, ...options } = driverConfig;

	return { driver, options };
}
