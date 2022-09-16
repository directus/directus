import type { Knex } from 'knex';
import type { SchemaInspectorConstructor } from './types/schema.js';

import MySQLSchemaInspector from './dialects/mysql.js';
import PostgresSchemaInspector from './dialects/postgres.js';
import CockroachDBSchemaInspector from './dialects/cockroachdb.js';
import SqliteSchemaInspector from './dialects/sqlite.js';
import OracleDBSchemaInspector from './dialects/oracledb.js';
import MSSQLSchemaInspector from './dialects/mssql.js';

export function SchemaInspector(knex: Knex) {
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
}

export default SchemaInspector;
