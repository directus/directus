import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import path from 'path';
import { performance } from 'perf_hooks';
import { useEnv } from '@directus/env';
import type { SchemaInspector } from '@directus/schema';
import { createInspector } from '@directus/schema';
import type { DatabaseClient } from '@directus/types';
import { isObject } from '@directus/utils';
import fse from 'fs-extra';
import type { Knex } from 'knex';
import knex from 'knex';
import { isArray, merge, toArray } from 'lodash-es';
import { getExtensionsPath } from '../extensions/lib/get-extensions-path.js';
import { useLogger } from '../logger/index.js';
import { useMetrics } from '../metrics/index.js';
import { getConfigFromEnv } from '../utils/get-config-from-env.js';
import { validateEnv } from '../utils/validate-env.js';
import { getHelpers } from './helpers/index.js';

type QueryInfo = Partial<Knex.Sql> & {
	sql: Knex.Sql['sql'];
	__knexUid: string;
	__knexTxId: string;
	[key: string | number | symbol]: any;
};

let database: Knex | null = null;
let inspector: SchemaInspector | null = null;

const __dirname = dirname(fileURLToPath(import.meta.url));

export default getDatabase;

export function getDatabase(): Knex {
	if (database) {
		return database;
	}

	const env = useEnv();
	const logger = useLogger();
	const metrics = useMetrics();

	const {
		client,
		version,
		searchPath,
		connectionString,
		pool: poolConfig = {},
		...connectionConfig
	} = getConfigFromEnv('DB_', { omitPrefix: 'DB_EXCLUDE_TABLES' });

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

	validateEnv(requiredEnvVars);

	const knexConfig: Knex.Config = {
		client,
		version,
		searchPath,
		connection: connectionString || connectionConfig,
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
		pool: poolConfig,
	};

	if (client === 'sqlite3') {
		knexConfig.useNullAsDefault = true;

		poolConfig.afterCreate = (conn: any, callback: any) => {
			logger.trace('Enabling SQLite Foreign Keys support...');

			conn.run('PRAGMA foreign_keys = ON');

			callback(null, conn);
		};
	}

	if (client === 'cockroachdb') {
		poolConfig.afterCreate = (conn: any, callback: any) => {
			logger.trace('Setting CRDB serial_normalization and default_int_size');

			conn.query('SET serial_normalization = "sql_sequence"');
			conn.query('SET default_int_size = 4');

			callback(null, conn);
		};
	}

	if (client === 'oracledb') {
		poolConfig.afterCreate = (conn: any, callback: any) => {
			logger.trace('Setting OracleDB NLS_DATE_FORMAT and NLS_TIMESTAMP_FORMAT');

			// enforce proper ISO standard 2024-12-10T10:54:00.123Z for datetime/timestamp
			conn.execute('ALTER SESSION SET NLS_TIMESTAMP_FORMAT = \'YYYY-MM-DD"T"HH24:MI:SS.FF3"Z"\'');

			// enforce 2024-12-10 date formet
			conn.execute("ALTER SESSION SET NLS_DATE_FORMAT = 'YYYY-MM-DD'");

			callback(null, conn);
		};
	}

	if (client === 'mysql') {
		// Remove the conflicting `filename` option, defined by default in the Docker Image
		if (isObject(knexConfig.connection)) delete knexConfig.connection['filename'];

		Object.assign(knexConfig, { client: 'mysql2' });
	}

	if (client === 'mssql') {
		// This brings MS SQL in line with the other DB vendors. We shouldn't do any automatic
		// timezone conversion on the database level, especially not when other database vendors don't
		// act the same
		merge(knexConfig, { connection: { options: { useUTC: false } } });
	}

	database = knex.default(knexConfig);
	validateDatabaseCharset(database);

	const times = new Map<string, number>();

	database
		.on('query', ({ __knexUid }: QueryInfo) => {
			times.set(__knexUid, performance.now());
		})
		.on('query-response', (_response, queryInfo: QueryInfo) => {
			const time = times.get(queryInfo.__knexUid);
			let delta;

			if (time) {
				delta = performance.now() - time;
				times.delete(queryInfo.__knexUid);

				metrics?.getDatabaseResponseMetric()?.observe(delta);
			}

			// eslint-disable-next-line no-nested-ternary
			const bindings = queryInfo.bindings
				? isArray(queryInfo.bindings)
					? queryInfo.bindings
					: Object.values(queryInfo.bindings)
				: [];

			logger.trace(`[${delta ? delta.toFixed(3) : '?'}ms] ${queryInfo.sql} [${bindings.join(', ')}]`);
		})
		.on('query-error', (_, queryInfo: QueryInfo) => {
			times.delete(queryInfo.__knexUid);
		});

	return database;
}

export function getSchemaInspector(database?: Knex): SchemaInspector {
	if (inspector) {
		return inspector;
	}

	database ??= getDatabase();

	inspector = createInspector(database);

	return inspector;
}

export async function hasDatabaseConnection(database?: Knex): Promise<boolean> {
	database = database ?? getDatabase();

	try {
		if (getDatabaseClient(database) === 'oracle') {
			await database.raw('select 1 from DUAL');
		} else {
			await database.raw('SELECT 1');
		}

		return true;
	} catch {
		return false;
	}
}

export async function validateDatabaseConnection(database?: Knex): Promise<void> {
	database = database ?? getDatabase();
	const logger = useLogger();

	try {
		if (getDatabaseClient(database) === 'oracle') {
			await database.raw('select 1 from DUAL');
		} else {
			await database.raw('SELECT 1');
		}
	} catch (error: any) {
		logger.error(`Can't connect to the database.`);
		logger.error(error);
		process.exit(1);
	}
}

export function getDatabaseClient(database?: Knex): DatabaseClient {
	database = database ?? getDatabase();

	switch (database.client.constructor.name) {
		case 'Client_MySQL2':
			return 'mysql';
		case 'Client_PG':
			return 'postgres';
		case 'Client_CockroachDB':
			return 'cockroachdb';
		case 'Client_SQLite3':
			return 'sqlite';
		case 'Client_Oracledb':
		case 'Client_Oracle':
			return 'oracle';
		case 'Client_MSSQL':
			return 'mssql';
		case 'Client_Redshift':
			return 'redshift';
	}

	throw new Error(`Couldn't extract database client`);
}

export async function isInstalled(): Promise<boolean> {
	const inspector = getSchemaInspector();

	// The existence of a directus_collections table alone isn't a "proper" check to see if everything
	// is installed correctly of course, but it's safe enough to assume that this collection only
	// exists when Directus is properly installed.
	return await inspector.hasTable('directus_collections');
}

export async function validateMigrations(): Promise<boolean> {
	const database = getDatabase();
	const logger = useLogger();

	try {
		let migrationFiles = await fse.readdir(path.join(__dirname, 'migrations'));

		const customMigrationsPath = path.resolve(getExtensionsPath(), 'migrations');

		let customMigrationFiles =
			((await fse.pathExists(customMigrationsPath)) && (await fse.readdir(customMigrationsPath))) || [];

		migrationFiles = migrationFiles.filter(
			(file: string) => file.startsWith('run') === false && file.endsWith('.d.ts') === false,
		);

		customMigrationFiles = customMigrationFiles.filter((file: string) => file.endsWith('.js'));

		migrationFiles.push(...customMigrationFiles);

		const requiredVersions = migrationFiles.map((filePath) => filePath.split('-')[0]);

		const completedVersions = (await database.select('version').from('directus_migrations')).map(
			({ version }) => version,
		);

		return requiredVersions.every((version) => completedVersions.includes(version));
	} catch (error: any) {
		logger.error(`Database migrations cannot be found`);
		logger.error(error);
		throw process.exit(1);
	}
}

/**
 * These database extensions should be optional, so we don't throw or return any problem states when they don't
 */
export async function validateDatabaseExtensions(): Promise<void> {
	const logger = useLogger();
	const database = getDatabase();
	const client = getDatabaseClient(database);
	const helpers = getHelpers(database);
	const geometrySupport = await helpers.st.supported();

	if (!geometrySupport) {
		switch (client) {
			case 'postgres':
				logger.warn(`PostGIS isn't installed. Geometry type support will be limited.`);
				break;
			case 'sqlite':
				logger.warn(`Spatialite isn't installed. Geometry type support will be limited.`);
				break;
			default:
				logger.warn(`Geometry type not supported on ${client}`);
				break;
		}
	}
}

async function validateDatabaseCharset(database?: Knex): Promise<void> {
	const env = useEnv();
	database = database ?? getDatabase();
	const logger = useLogger();

	if (getDatabaseClient(database) === 'mysql') {
		const { collation } = await database.select(database.raw(`@@collation_database as collation`)).first();

		const tables = await database('information_schema.tables')
			.select({ name: 'TABLE_NAME', collation: 'TABLE_COLLATION' })
			.where({ TABLE_SCHEMA: env['DB_DATABASE'] });

		const columns = await database('information_schema.columns')
			.select({ table_name: 'TABLE_NAME', name: 'COLUMN_NAME', collation: 'COLLATION_NAME' })
			.where({ TABLE_SCHEMA: env['DB_DATABASE'] })
			.whereNot({ COLLATION_NAME: collation });

		const excludedTables: string[] = toArray(env['DB_EXCLUDE_TABLES']);

		let inconsistencies = '';

		for (const table of tables) {
			if (excludedTables.includes(table.name)) continue;

			const tableColumns = columns.filter((column) => column.table_name === table.name);
			const tableHasInvalidCollation = table.collation !== collation;

			if (tableHasInvalidCollation || tableColumns.length > 0) {
				inconsistencies += `\t\t- Table "${table.name}": "${table.collation}"\n`;

				for (const column of tableColumns) {
					inconsistencies += `\t\t  - Column "${column.name}": "${column.collation}"\n`;
				}
			}
		}

		if (inconsistencies) {
			logger.warn(
				`Some tables and columns do not match your database's default collation (${collation}):\n${inconsistencies}`,
			);
		}
	}

	return;
}
