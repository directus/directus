import database from '../../database';
import { extractError as postgres } from './dialects/postgres';
import { extractError as mysql } from './dialects/mysql';
import { extractError as mssql } from './dialects/mssql';
import { extractError as sqlite } from './dialects/sqlite';
import { extractError as oracle } from './dialects/oracle';

export function translateKnexError(error: any) {
	switch (database.client.constructor.name) {
		case 'Client_MySQL':
			return mysql(error);
		case 'Client_PG':
			return postgres(error);
		case 'Client_SQLite3':
			return sqlite(error);
		case 'Client_Oracledb':
		case 'Client_Oracle':
			return oracle(error);
		case 'Client_MSSQL':
			return mssql(error);

		default:
			return error;
	}
}
