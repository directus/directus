import knex, { Config } from 'knex';
import dotenv from 'dotenv';
import camelCase from 'camelcase';
import path from 'path';

import SchemaInspector from '../knex-schema-inspector/lib/index';

dotenv.config({ path: path.resolve(__dirname, '../../', '.env') });

const connectionConfig: Record<string, any> = {};

for (let [key, value] of Object.entries(process.env)) {
	key = key.toLowerCase();
	if (key.startsWith('db') === false) continue;
	if (key === 'db_client') continue;

	key = key.slice(3); // remove `DB_`

	connectionConfig[camelCase(key)] = value;
}

const knexConfig: Config = {
	client: process.env.DB_CLIENT,
	connection: connectionConfig,
};

if (process.env.DB_CLIENT === 'sqlite3') {
	knexConfig.useNullAsDefault = true;
}

const database = knex(knexConfig);

export const schemaInspector = SchemaInspector(database);

export default database;
