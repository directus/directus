export function isValidEnv(env: Record<string, unknown>): string[] {
	const client = env['DB_CLIENT'];

	if (typeof client !== 'string') return ['DB_CLIENT'];

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

	return requiredEnvVars.filter((requiredKey) => requiredKey in env === false);
}
