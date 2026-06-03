import type { Knex } from 'knex';
import * as dateHelpers from './date/index.js';

export type DatabaseClient = 'mysql' | 'postgres' | 'cockroachdb' | 'sqlite' | 'oracle' | 'mssql' | 'redshift';

export function getDatabaseClient(database: Knex): DatabaseClient {
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

export function getHelpers(database: Knex) {
	const client = getDatabaseClient(database);

	return {
		date: new dateHelpers[client](database),
	};
}

export type Helpers = ReturnType<typeof getHelpers>;
