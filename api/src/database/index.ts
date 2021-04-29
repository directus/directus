import { knex, Knex } from 'knex';
import dotenv from 'dotenv';
import path from 'path';
import logger from '../logger';
import env from '../env';
import { validateEnv } from '../utils/validate-env';
import { performance } from 'perf_hooks';

import SchemaInspector from '@directus/schema';
import { getConfigFromEnv } from '../utils/get-config-from-env';

dotenv.config({ path: path.resolve(__dirname, '../../', '.env') });

const connectionConfig: Record<string, any> = getConfigFromEnv('DB_', [
	'DB_CLIENT',
	'DB_SEARCH_PATH',
	'DB_CONNECTION_STRING',
	'DB_POOL',
]);

const poolConfig = getConfigFromEnv('DB_POOL');

validateEnv(['DB_CLIENT']);

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

const database = knex(knexConfig);

const times: Record<string, number> = {};

database
	.on('query', (queryInfo) => {
		times[queryInfo.__knexUid] = performance.now();
	})
	.on('query-response', (response, queryInfo) => {
		const delta = performance.now() - times[queryInfo.__knexUid];
		logger.trace(`[${delta.toFixed(3)}ms] ${queryInfo.sql} [${queryInfo.bindings.join(', ')}]`);
	});

export async function hasDatabaseConnection(): Promise<boolean> {
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

export const schemaInspector = SchemaInspector(database);

export async function isInstalled(): Promise<boolean> {
	// The existence of a directus_collections table alone isn't a "proper" check to see if everything
	// is installed correctly of course, but it's safe enough to assume that this collection only
	// exists when using the installer CLI.
	return await schemaInspector.hasTable('directus_collections');
}

export default database;
