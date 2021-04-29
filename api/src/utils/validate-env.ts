import logger from '../logger';
import env from '../env';

export function validateEnv(requiredKeys: string[]): void {
	if (env.DB_CLIENT && env.DB_CLIENT === 'sqlite3') {
		requiredKeys.push('DB_FILENAME');
	} else if (env.DB_CLIENT && env.DB_CLIENT === 'oracledb') {
		requiredKeys.push('DB_USER', 'DB_PASSWORD', 'DB_CONNECT_STRING');
	} else {
		if (env.DB_CLIENT === 'pg') {
			if (!env.DB_CONNECTION_STRING) {
				requiredKeys.push('DB_HOST', 'DB_PORT', 'DB_DATABASE', 'DB_USER');
			}
		} else {
			requiredKeys.push('DB_HOST', 'DB_PORT', 'DB_DATABASE', 'DB_USER', 'DB_PASSWORD');
		}
	}

	for (const requiredKey of requiredKeys) {
		if (env.hasOwnProperty(requiredKey) === false) {
			logger.error(`"${requiredKey}" Environment Variable is missing.`);
			process.exit(1);
		}
	}
}
