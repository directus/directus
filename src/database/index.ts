import knex from 'knex';
import dotenv from 'dotenv';

import SchemaInspector from '../knex-schema-inspector/lib/index';

dotenv.config();

const database = knex({
	client: process.env.DB_CLIENT,
	connection: {
		host: process.env.DB_HOST,
		port: Number(process.env.DB_PORT),
		user: process.env.DB_USER,
		password: process.env.DB_PASSWORD,
		database: process.env.DB_NAME,
	},
	migrations: {
		extension: 'ts',
		directory: './src/database/migrations',
	},
	seeds: {
		extension: 'ts',
		directory: './src/database/seeds/',
	},
});

export const schemaInspector = SchemaInspector(database);

export default database;
