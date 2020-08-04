import knex, { Config } from 'knex';
import dotenv from 'dotenv';
import camelCase from 'camelcase';
import path from 'path';
import logger from '../logger';
import env from '../env';

import SchemaInspector from 'knex-schema-inspector';

dotenv.config({ path: path.resolve(__dirname, '../../', '.env') });

const connectionConfig: Record<string, any> = {};

for (let [key, value] of Object.entries(env)) {
	key = key.toLowerCase();
	if (key.startsWith('db') === false) continue;
	if (key === 'db_client') continue;

	key = key.slice(3); // remove `DB_`

	connectionConfig[camelCase(key)] = value;
}

const knexConfig: Config = {
	client: env.DB_CLIENT,
	connection: connectionConfig,
	log: {
		warn: (msg) => {
			/** @note this is wild */
			if (msg === '.returning() is not supported by mysql and will not have any effect.')
				return;
			logger.warn(msg);
		},
		error: (msg) => logger.error(msg),
		deprecate: (msg) => logger.info(msg),
		debug: (msg) => logger.debug(msg),
	},
};

if (env.DB_CLIENT === 'sqlite3') {
	knexConfig.useNullAsDefault = true;
}

const database = knex(knexConfig);

export async function validateDBConnection() {
	try {
		await database.raw('select 1+1 as result');
	} catch (error) {
		logger.fatal(`Can't connect to the database.`);
		logger.fatal(error);
		process.exit(1);
	}
}

export const schemaInspector = SchemaInspector(database);
export default database;
