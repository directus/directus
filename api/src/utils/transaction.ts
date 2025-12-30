import { getDatabaseClient } from '../database/index.js';
import { useLogger } from '../logger/index.js';
import type { DatabaseClient } from '@directus/types';
import { isObject } from '@directus/utils';
import { type Knex } from 'knex';

/**
 * Execute the given handler within the current transaction or a newly created one
 * if the current knex state isn't a transaction yet.
 *
 * Can be used to ensure the handler is run within a transaction,
 * while preventing nested transactions.
 */
export const transaction = async <T = unknown>(
	knex: Knex,
	handler: (knex: Knex.Transaction) => Promise<T>,
): Promise<T> => {
	if (knex.isTransaction) {
		return handler(knex as Knex.Transaction);
	} else {
		try {
			return await knex.transaction((trx) => handler(trx));
		} catch (error) {
			const client = getDatabaseClient(knex);

			if (!shouldRetryTransaction(client, error)) throw error;

			const MAX_ATTEMPTS = 3;
			const BASE_DELAY = 100;

			const logger = useLogger();

			for (let attempt = 0; attempt < MAX_ATTEMPTS; ++attempt) {
				const delay = 2 ** attempt * BASE_DELAY;

				await new Promise((resolve) => setTimeout(resolve, delay));

				logger.trace(`Restarting failed transaction (attempt ${attempt + 1}/${MAX_ATTEMPTS})`);

				try {
					return await knex.transaction((trx) => handler(trx));
				} catch (error) {
					if (!shouldRetryTransaction(client, error)) throw error;
				}
			}

			/** Initial execution + additional attempts */
			const attempts = 1 + MAX_ATTEMPTS;
			throw new Error(`Transaction failed after ${attempts} attempts`, { cause: error });
		}
	}
};

function shouldRetryTransaction(client: DatabaseClient, error: unknown): boolean {
	/**
	 * This error code indicates that the transaction failed due to another
	 * concurrent or recent transaction attempting to write to the same data.
	 * This can usually be solved by restarting the transaction on client-side
	 * after a short delay, so that it is executed against the latest state.
	 *
	 * @link https://www.cockroachlabs.com/docs/stable/transaction-retry-error-reference
	 */
	const COCKROACH_RETRY_ERROR_CODE = '40001';

	/**
	 * SQLITE_BUSY is an error code returned by SQLite when an operation can't be
	 * performed due to a locked database file. This often arises due to multiple
	 * processes trying to simultaneously access the database, causing potential
	 * data inconsistencies. There are a few mechanisms to handle this case,
	 * one of which is to retry the complete transaction again
	 * on client-side after a short delay.
	 *
	 * @link https://www.sqlite.org/rescode.html#busy
	 */
	const SQLITE_BUSY_ERROR_CODE = 'SQLITE_BUSY';
	// Both mariadb and mysql
	const MYSQL_DEADLOCK_CODE = 'ER_LOCK_DEADLOCK';
	const POSTGRES_DEADLOCK_CODE = '40P01';
	const ORACLE_DEADLOCK_CODE = 'ORA-00060';
	const MSSQL_DEADLOCK_CODE = 'EREQUEST';
	const MSSQL_DEADLOCK_NUMBER = '1205';

	const codes: Record<DatabaseClient, Record<string, any>[]> = {
		cockroachdb: [{ code: COCKROACH_RETRY_ERROR_CODE }],
		sqlite: [{ code: SQLITE_BUSY_ERROR_CODE }],
		mysql: [{ code: MYSQL_DEADLOCK_CODE }],
		mssql: [{ code: MSSQL_DEADLOCK_CODE, number: MSSQL_DEADLOCK_NUMBER }],
		oracle: [{ code: ORACLE_DEADLOCK_CODE }],
		postgres: [{ code: POSTGRES_DEADLOCK_CODE }],
		redshift: [],
	};

	return (
		isObject(error) &&
		codes[client].some((code) => {
			return Object.entries(code).every(([key, value]) => String(error[key]) === value);
		})
	);
}
