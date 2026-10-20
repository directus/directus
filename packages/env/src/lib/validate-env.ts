import type { Env } from '../types/env.js';

type HostConnectionEnv = {
	DB_HOST: string;
	DB_PORT: number;
	DB_DATABASE: string;
	DB_USER: string;
	DB_PASSWORD: string;
};

type SqliteEnv = {
	DB_CLIENT: 'sqlite3';
	DB_FILENAME: string;
};

type OracleEnv = { DB_CLIENT: 'oracledb' } & (
	| HostConnectionEnv
	| {
			DB_USER: string;
			DB_PASSWORD: string;
			DB_CONNECT_STRING: string;
	  }
);

type PostgresEnv = { DB_CLIENT: 'pg' | 'cockroachdb' } & (
	| Omit<HostConnectionEnv, 'DB_PASSWORD'>
	| {
			DB_CONNECTION_STRING: string;
	  }
);

type MysqlEnv = { DB_CLIENT: 'mysql' } & (
	| HostConnectionEnv
	| {
			DB_DATABASE: string;
			DB_USER: string;
			DB_PASSWORD: string;
			DB_SOCKET_PATH: string;
	  }
);

type MssqlEnv = { DB_CLIENT: 'mssql' } & (
	| (HostConnectionEnv & { DB_TYPE?: 'default' })
	| {
			DB_TYPE: string;
	  }
);

export type DatabaseEnv = SqliteEnv | OracleEnv | PostgresEnv | MysqlEnv | MssqlEnv;

/**
 * Asserts that all environment variables required to connect to the database are set.
 * Exits the process if any of them are missing.
 */
export function validateDbEnv<T extends Env>(env: T): asserts env is T & DatabaseEnv {
	const client = env['DB_CLIENT'];
	const connectionString = env['DB_CONNECTION_STRING'];

	const requiredEnvVars = ['DB_CLIENT'];

	switch (client) {
		case 'sqlite3':
			requiredEnvVars.push('DB_FILENAME');
			break;

		case 'oracledb':
			if (!env['DB_CONNECT_STRING']) {
				requiredEnvVars.push('DB_HOST', 'DB_PORT', 'DB_DATABASE', 'DB_USER', 'DB_PASSWORD');
			} else {
				requiredEnvVars.push('DB_USER', 'DB_PASSWORD', 'DB_CONNECT_STRING');
			}

			break;

		case 'cockroachdb':
		case 'pg':
			if (!connectionString) {
				requiredEnvVars.push('DB_HOST', 'DB_PORT', 'DB_DATABASE', 'DB_USER');
			} else {
				requiredEnvVars.push('DB_CONNECTION_STRING');
			}

			break;
		case 'mysql':
			if (!env['DB_SOCKET_PATH']) {
				requiredEnvVars.push('DB_HOST', 'DB_PORT', 'DB_DATABASE', 'DB_USER', 'DB_PASSWORD');
			} else {
				requiredEnvVars.push('DB_DATABASE', 'DB_USER', 'DB_PASSWORD', 'DB_SOCKET_PATH');
			}

			break;
		case 'mssql':
			if (!env['DB_TYPE'] || env['DB_TYPE'] === 'default') {
				requiredEnvVars.push('DB_HOST', 'DB_PORT', 'DB_DATABASE', 'DB_USER', 'DB_PASSWORD');
			}

			break;
		default:
			requiredEnvVars.push('DB_HOST', 'DB_PORT', 'DB_DATABASE', 'DB_USER', 'DB_PASSWORD');
	}

	const missingEnvKeys = requiredEnvVars.filter((requiredKey) => requiredKey in env === false);

	if (missingEnvKeys.length > 0) {
		// eslint-disable-next-line no-console
		console.error(`"${missingEnvKeys.join(',')}" Environment Variable(s) is missing.`);
		process.exit(1);
	}
}
