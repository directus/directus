import { isObject } from '@directus/utils';
import { default as knex, type Knex } from 'knex';
import { merge } from 'lodash-es';
import { type Env } from '../config.js';
import { type Logger } from '../logger.js';

/**
 * Build a Knex connection.
 * Connection settings mirror directus setup
 */
export function createDatabase(env: Env, logger: Logger): Knex {
	const client = env.DB_CLIENT;

	const connection: Record<string, any> =
		client === 'sqlite3'
			? { filename: env.DB_FILENAME }
			: {
					host: env.DB_HOST,
					port: Number(env.DB_PORT),
					user: env.DB_USER,
					password: env.DB_PASSWORD,
					database: env.DB_DATABASE,
				};

	const poolConfig: Knex.PoolConfig = {};

	const knexConfig: Knex.Config = {
		client,
		connection,
		pool: poolConfig,
		log: {
			warn: (msg) => {
				// Ignore warnings about returning not being supported in some DBs
				if (msg.startsWith('.returning()')) return;
				if (msg.endsWith('does not currently support RETURNING clause')) return;

				// Ignore warning about MySQL not supporting TRX for DDL
				if (msg.startsWith('Transaction was implicitly committed, do not mix transactions and DDL with MySQL')) return;

				return logger.warn(msg);
			},
			error: (msg) => logger.error(msg),
			deprecate: (msg) => logger.info(msg),
			debug: (msg) => logger.debug(msg),
		},
	};

	if (client === 'sqlite3') {
		knexConfig.useNullAsDefault = true;

		poolConfig.afterCreate = (conn: any, callback: any) => {
			logger.info('Enabling SQLite Foreign Keys support...');

			conn.run('PRAGMA foreign_keys = ON');

			callback(null, conn);
		};
	}

	if (client === 'cockroachdb') {
		poolConfig.afterCreate = (conn: any, callback: any) => {
			logger.info('Setting CRDB serial_normalization and default_int_size');

			conn.query('SET serial_normalization = "sql_sequence"');
			conn.query('SET default_int_size = 4');

			callback(null, conn);
		};
	}

	if (client === 'oracledb') {
		poolConfig.afterCreate = (conn: any, callback: any) => {
			logger.info('Setting OracleDB NLS_DATE_FORMAT and NLS_TIMESTAMP_FORMAT');

			// enforce proper ISO standard 2024-12-10T10:54:00.123Z for datetime/timestamp
			conn.execute('ALTER SESSION SET NLS_TIMESTAMP_FORMAT = \'YYYY-MM-DD"T"HH24:MI:SS.FF3"Z"\'');

			// enforce 2024-12-10 date formet
			conn.execute("ALTER SESSION SET NLS_DATE_FORMAT = 'YYYY-MM-DD'");

			callback(null, conn);
		};
	}

	if (client === 'mysql') {
		// Drop the conflicting `filename` option when mysql defaults leak it in
		if (isObject(knexConfig.connection)) delete (knexConfig.connection as any)['filename'];

		Object.assign(knexConfig, { client: 'mysql2' });
	}

	if (client === 'mssql') {
		// This brings MS SQL in line with the other DB vendors. We shouldn't do any automatic
		// timezone conversion on the database level, especially not when other database vendors don't
		// act the same
		merge(knexConfig, { connection: { options: { useUTC: false } } });
	}

	return knex(knexConfig);
}
