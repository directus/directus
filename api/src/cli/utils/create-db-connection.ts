import { knex, Knex } from 'knex';
import path from 'path';
import { promisify } from 'util';
import { Driver } from '../../types';

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
export default function createDBConnection(client: Driver, credentials: Credentials): Knex<any, unknown[]> {
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
		pool: {},
	};

	if (client === 'sqlite3') {
		knexConfig.useNullAsDefault = true;
	}

	if (client === 'cockroachdb') {
		knexConfig.pool!.afterCreate = async (conn: any, callback: any) => {
			const run = promisify(conn.query.bind(conn));

			await run('SET serial_normalization = "sql_sequence"');
			await run('SET default_int_size = 4');

			callback(null, conn);
		};
	}

	const db = knex(knexConfig);
	return db;
}
