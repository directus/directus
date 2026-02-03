import type { Knex } from 'knex';
import CockroachDBSchemaInspector from './dialects/cockroachdb.js';
import MSSQLSchemaInspector from './dialects/mssql.js';
import MySQLSchemaInspector from './dialects/mysql.js';
import OracleDBSchemaInspector from './dialects/oracledb.js';
import PostgresSchemaInspector from './dialects/postgres.js';
import SqliteSchemaInspector from './dialects/sqlite.js';
import type { SchemaInspectorConstructor } from './types/schema-inspector.js';

export * from './types/column.js';
export * from './types/foreign-key.js';
export * from './types/table.js';
export * from './types/overview.js';
export * from './types/schema-inspector.js';

export const createInspector = (knex: Knex) => {
	let constructor: SchemaInspectorConstructor;

	switch (knex.client.constructor.name) {
		case 'Client_MySQL':
		case 'Client_MySQL2':
			constructor = MySQLSchemaInspector;
			break;
		case 'Client_PG':
			constructor = PostgresSchemaInspector;
			break;
		case 'Client_CockroachDB':
			constructor = CockroachDBSchemaInspector;
			break;
		case 'Client_SQLite3':
			constructor = SqliteSchemaInspector;
			break;
		case 'Client_Oracledb':
		case 'Client_Oracle':
			constructor = OracleDBSchemaInspector;
			break;
		case 'Client_MSSQL':
			constructor = MSSQLSchemaInspector;
			break;

		default:
			throw Error('Unsupported driver used: ' + knex.client.constructor.name);
	}

	return new constructor(knex);
};
