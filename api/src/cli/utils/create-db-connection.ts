import { knex, Knex } from 'knex';
import path from 'path';

export type Credentials = {
	filename?: string;
	host?: string;
	port?: number;
	database?: string;
	user?: string;
	password?: string;
	ssl?: boolean;
	options__encrypt?: boolean;
};
export default function createDBConnection(
	client: 'sqlite3' | 'mysql' | 'pg' | 'oracledb' | 'mssql' | 'cockroachdb',
	credentials: Credentials
): Knex<any, unknown[]> {
	let connection: Knex.Config['connection'] = {};

	if (client === 'sqlite3') {
		const { filename } = credentials;

		connection = {
			filename: filename as string,
		};
	} else {
		const { host, port, database, user, password } = credentials as Credentials;

		connection = {
			host: host,
			port: Number(port),
			database: database,
			user: user,
			password: password,
		};

		if (client === 'pg' || client === 'cockroachdb') {
			const { ssl } = credentials as Credentials;
			connection['ssl'] = ssl;
		}

		if (client === 'mssql') {
			const { options__encrypt } = credentials as Credentials;

			(connection as Knex.MsSqlConnectionConfig)['options'] = {
				encrypt: options__encrypt,
			};
		}
	}

	const knexConfig: Knex.Config = {
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
