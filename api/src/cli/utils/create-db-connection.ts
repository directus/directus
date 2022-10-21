import { knex, Knex } from 'knex';
import path from 'path';
import { URL } from 'url';
import { promisify } from 'util';

export type Credentials = {
	filename?: string;
	connection_string?: URL;
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
		const { connection_string } = credentials;
		connection = connection_string?.toString();
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
