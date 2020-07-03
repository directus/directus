import knex from 'knex';
import logger from '../logger';

import SchemaInspector from '../knex-schema-inspector/lib/index';

const log = logger.child({ module: 'sql' });

const database = knex({
	client: process.env.DB_CLIENT,
	connection: {
		host: process.env.DB_HOST,
		port: Number(process.env.DB_PORT),
		user: process.env.DB_USER,
		password: process.env.DB_PASSWORD,
		database: process.env.DB_NAME,
	},
});

database.on('query', (data) => log.trace(data.sql));

export const schemaInspector = SchemaInspector(database);

export default database;
