import database from '../../database';
import { extractError as postgres } from './dialects/postgres';
import { extractError as mysql } from './dialects/mysql';
import { extractError as mssql } from './dialects/mssql';
import { extractError as sqlite } from './dialects/sqlite';
import { extractError as oracle } from './dialects/oracle';

/**
 * Translates an error thrown by any of the databases into a pre-defined Exception. Currently
 * supports:
 * - Invalid Foreign Key
 * - Not Null Violation
 * - Record Not Unique
 * - Value Out of Range
 * - Value Too Long
 */
export async function translateDatabaseError(error: any) {
	switch (database.client.constructor.name) {
		case 'Client_MySQL':
			return await mysql(error);
		case 'Client_PG':
			return await postgres(error);
		case 'Client_SQLite3':
			return await sqlite(error);
		case 'Client_Oracledb':
		case 'Client_Oracle':
			return await oracle(error);
		case 'Client_MSSQL':
			return await mssql(error);

		default:
			return error;
	}
}
