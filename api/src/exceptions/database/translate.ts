import { compact, last } from 'lodash';
import { getDatabaseClient } from '../../database';
import emitter from '../../emitter';
import { extractError as mssql } from './dialects/mssql';
import { extractError as mysql } from './dialects/mysql';
import { extractError as oracle } from './dialects/oracle';
import { extractError as postgres } from './dialects/postgres';
import { extractError as sqlite } from './dialects/sqlite';
import { SQLError } from './dialects/types';

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

	const hookResult = await emitter.emitFilter('database.error', defaultError, { client });
	const hookError = Array.isArray(hookResult) ? last(compact(hookResult)) : hookResult;

	return hookError || defaultError;
}
