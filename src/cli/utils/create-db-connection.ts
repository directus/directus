import knex, { Config } from 'knex';
import path from 'path';

export type Credentials = {
	filename?: string;
	host?: string;
	port?: number;
	database?: string;
	user?: string;
	password?: string;
};
export default function createDBConnection(
	client: 'sqlite3' | 'mysql' | 'pg' | 'oracledb' | 'mssql',
	credentials: Credentials
) {
	let connection: Config['connection'] = {};

	if (client === 'sqlite3') {
		const { filename } = credentials;

		connection = {
			filename: filename as string,
		};
	} else {
		const { host, port, database, user, password } = credentials as Credentials;

		connection = {
			host: host,
			port: port,
			database: database,
			user: user,
			password: password,
		};
	}

	const knexConfig: Config = {
		client: client,
		connection: connection,
		seeds: {
			extension: 'js',
			directory: path.resolve(__dirname, '../../database/seeds/'),
		},
	};

	if (client === 'sqlite3') {
		knexConfig.useNullAsDefault = true;
	}

	const db = knex(knexConfig);
	return db;
}
