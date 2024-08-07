import { type Knex } from 'knex';
import { getDatabaseClient } from '../database/index.js';
import { useLogger } from '../logger/index.js';

/**
 * Execute the given handler within the current transaction or a newly created one
 * if the current knex state isn't a transaction yet.
 *
 * Can be used to ensure the handler is run within a transaction,
 * while preventing nested transactions.
 */
export const transaction = async <T = unknown>(knex: Knex, handler: (knex: Knex) => Promise<T>): Promise<T> => {
	if (knex.isTransaction) {
		return handler(knex);
	} else {
		try {
			return await knex.transaction((trx) => handler(trx));
		} catch (error: any) {
			const client = getDatabaseClient(knex);

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
			 * data inconsistencies. To handle this, one can utilize a retry mechanism
			 * where the operation is attempted again after a short delay. Further
			 * solutions include using serialized or Write-Ahead Logging (WAL) modes
			 * in SQLite, both facilitating simultaneous access by multiple applications.
			 *
			 * @link https://www.sqlite.org/rescode.html#busy
			 */
			const SQLITE_BUSY_ERROR_CODE = 'SQLITE_BUSY';

			if (
				(client === 'cockroachdb' && error?.code !== COCKROACH_RETRY_ERROR_CODE) ||
				(client === 'sqlite' && error?.code !== SQLITE_BUSY_ERROR_CODE)
			) throw error;

			const MAX_ATTEMPTS = 3;
			const BASE_DELAY = 100;

			const logger = useLogger();

			for (let attempt = 0; attempt < MAX_ATTEMPTS; ++attempt) {
				const delay = 2 ** attempt * BASE_DELAY;

				await new Promise((resolve) => setTimeout(resolve, delay));

				logger.trace(`Restarting failed transaction (attempt ${attempt + 1}/${MAX_ATTEMPTS})`);

				try {
					return await knex.transaction((trx) => handler(trx));
				} catch (error: any) {
					if (error?.code !== COCKROACH_RETRY_ERROR_CODE && error?.code !== SQLITE_BUSY_ERROR_CODE) throw error;
				}
			}

			/** Initial execution + additional attempts */
			const attempts = 1 + MAX_ATTEMPTS;
			throw new Error(`Transaction failed after ${attempts} attempts`, { cause: error });
		}
	}
};
