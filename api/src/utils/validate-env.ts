import { getEnv } from '../env.js';
import logger from '../logger.js';

export function validateEnv(requiredKeys: string[]): void {
	const env = getEnv();

	for (const requiredKey of requiredKeys) {
		if (requiredKey in env === false) {
			logger.error(`"${requiredKey}" Environment Variable is missing.`);
			process.exit(1);
		}
	}
}
