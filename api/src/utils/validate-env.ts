import { getEnv } from '../env';
import logger from '../logger';

export function validateEnv(requiredKeys: string[]): void {
	const env = getEnv();

	for (const requiredKey of requiredKeys) {
		if (requiredKey in env === false) {
			logger.error(`"${requiredKey}" Environment Variable is missing.`);
			process.exit(1);
		}
	}
}
