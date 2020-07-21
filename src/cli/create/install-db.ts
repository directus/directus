import knex, { Config } from 'knex';

export type Credentials = {
	filename?: string;
	host?: string;
	port?: number;
	database?: string;
	username?: string;
	password?: string;
};
export default async function installDB(
	client: 'sqlite3' | 'mysql' | 'pg' | 'oracledb' | 'mssql',
	credentials: Credentials
): Promise<void> {
	let connection: Config['connection'] = {};

	if (client === 'sqlite3') {
		const { filename } = credentials;

		connection = {
			filename: filename,
		};
	} else {
		const { host, port, database, username, password } = credentials as Credentials;

		connection = {
			host: host,
			port: port,
			database: database,
			user: username,
			password: password,
		};
	}

	const knexConfig: Config = {
		client: client,
		connection: connection,
		seeds:
			process.env.NODE_ENV === 'development'
				? {
						extension: 'ts',
						directory: './src/database/seeds/',
				  }
				: {
						extension: 'js',
						directory: './dist/database/seeds/',
				  },
	};

	if (client === 'sqlite3') {
		knexConfig.useNullAsDefault = true;
	}

	const db = knex(knexConfig);

	await db.seed.run();

	db.destroy();
}
