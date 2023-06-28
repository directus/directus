import getDatabase, { getDatabaseClient } from '../index.js';
import emitter from '../../emitter.js';
import { extractError as mssql } from './dialects/mssql.js';
import { extractError as mysql } from './dialects/mysql.js';
import { extractError as oracle } from './dialects/oracle.js';
import { extractError as postgres } from './dialects/postgres.js';
import { extractError as sqlite } from './dialects/sqlite.js';
import type { SQLError } from './dialects/types.js';

/**
 * Translates an error thrown by any of the databases into a pre-defined Exception. Currently
 * supports:
 * - Invalid Foreign Key
 * - Not Null Violation
 * - Record Not Unique
 * - Value Out of Range
 * - Value Too Long
 */
export async function translateDatabaseError(error: SQLError): Promise<any> {
	const client = getDatabaseClient();
	let defaultError: any;

	switch (client) {
		case 'mysql':
			defaultError = mysql(error);
			break;
		case 'cockroachdb':
		case 'postgres':
			defaultError = postgres(error);
			break;
		case 'sqlite':
			defaultError = sqlite(error);
			break;
		case 'oracle':
			defaultError = oracle(error);
			break;
		case 'mssql':
			defaultError = await mssql(error);
			break;
	}

	const hookError = await emitter.emitFilter(
		'database.error',
		defaultError,
		{ client },
		{
			database: getDatabase(),
			schema: null,
			accountability: null,
		}
	);

	return hookError;
}
