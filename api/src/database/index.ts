import SchemaInspector from '@directus/schema';
import { knex, Knex } from 'knex';
import { performance } from 'perf_hooks';
import env from '../env';
import logger from '../logger';
import { getConfigFromEnv } from '../utils/get-config-from-env';
import { validateEnv } from '../utils/validate-env';

let database: Knex | null = null;
let inspector: ReturnType<typeof SchemaInspector> | null = null;

export default function getDatabase(): Knex {
	if (database) {
		return database;
	}

	const connectionConfig: Record<string, any> = getConfigFromEnv('DB_', [
		'DB_CLIENT',
		'DB_SEARCH_PATH',
		'DB_CONNECTION_STRING',
		'DB_POOL',
	]);

	const poolConfig = getConfigFromEnv('DB_POOL');

	const requiredEnvVars = ['DB_CLIENT'];

	if (env.DB_CLIENT && env.DB_CLIENT === 'sqlite3') {
		requiredEnvVars.push('DB_FILENAME');
	} else if (env.DB_CLIENT && env.DB_CLIENT === 'oracledb') {
		requiredEnvVars.push('DB_USER', 'DB_PASSWORD', 'DB_CONNECT_STRING');
	} else {
		if (env.DB_CLIENT === 'pg') {
			if (!env.DB_CONNECTION_STRING) {
				requiredEnvVars.push('DB_HOST', 'DB_PORT', 'DB_DATABASE', 'DB_USER');
			}
		} else {
			requiredEnvVars.push('DB_HOST', 'DB_PORT', 'DB_DATABASE', 'DB_USER', 'DB_PASSWORD');
		}
	}

	validateEnv(requiredEnvVars);

	const knexConfig: Knex.Config = {
		client: env.DB_CLIENT,
		searchPath: env.DB_SEARCH_PATH,
		connection: env.DB_CONNECTION_STRING || connectionConfig,
		log: {
			warn: (msg) => logger.warn(msg),
			error: (msg) => logger.error(msg),
			deprecate: (msg) => logger.info(msg),
			debug: (msg) => logger.debug(msg),
		},
		pool: poolConfig,
	};

	if (env.DB_CLIENT === 'sqlite3') {
		knexConfig.useNullAsDefault = true;
		poolConfig.afterCreate = (conn: any, cb: any) => {
			conn.run('PRAGMA foreign_keys = ON', cb);
		};
	}

	database = knex(knexConfig);

	const times: Record<string, number> = {};

	database
		.on('query', (queryInfo) => {
			times[queryInfo.__knexUid] = performance.now();
		})
		.on('query-response', (response, queryInfo) => {
			const delta = performance.now() - times[queryInfo.__knexUid];
			logger.trace(`[${delta.toFixed(3)}ms] ${queryInfo.sql} [${queryInfo.bindings.join(', ')}]`);
			delete times[queryInfo.__knexUid];
		});

	return database;
}

export function getSchemaInspector(): ReturnType<typeof SchemaInspector> {
	if (inspector) {
		return inspector;
	}

	const database = getDatabase();

	inspector = SchemaInspector(database);

	return inspector;
}

export async function hasDatabaseConnection(): Promise<boolean> {
	const database = getDatabase();

	try {
		if (env.DB_CLIENT === 'oracledb') {
			await database.raw('select 1 from DUAL');
		} else {
			await database.raw('SELECT 1');
		}
		return true;
	} catch {
		return false;
	}
}

export async function validateDBConnection(): Promise<void> {
	try {
		await hasDatabaseConnection();
	} catch (error) {
		logger.error(`Can't connect to the database.`);
		logger.error(error);
		process.exit(1);
	}
}

export async function isInstalled(): Promise<boolean> {
	const inspector = getSchemaInspector();

	// The existence of a directus_collections table alone isn't a "proper" check to see if everything
	// is installed correctly of course, but it's safe enough to assume that this collection only
	// exists when using the installer CLI.
	return await inspector.hasTable('directus_collections');
}
