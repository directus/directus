import { Knex } from 'knex';

import { HelperPostgres } from './dialects/postgres';
import { HelperMySQL } from './dialects/mysql';
import { HelperMSSQL } from './dialects/mssql';
import { HelperSQLite } from './dialects/sqlite';
import { HelperOracle } from './dialects/oracle';

import { HelperFn } from './types';

export function FunctionsHelper(knex: Knex): HelperFn {
	switch (knex.client.constructor.name) {
		case 'Client_MySQL':
			return new HelperMySQL(knex);
		case 'Client_PG':
			return new HelperPostgres(knex);
		case 'Client_SQLite3':
			return new HelperSQLite(knex);
		case 'Client_Oracledb':
		case 'Client_Oracle':
			return new HelperOracle(knex);
		case 'Client_MSSQL':
			return new HelperMSSQL(knex);
		default:
			throw Error('Unsupported driver used: ' + knex.client.constructor.name);
	}
}
