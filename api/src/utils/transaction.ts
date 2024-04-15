import type { Knex } from 'knex';

/**
 * Execute the given handler within the current transaction or a newly created one
 * if the current knex state isn't a transaction yet.
 *
 * Can be used to ensure the handler is run within a transaction,
 * while preventing nested transactions.
 */
export const transaction = <T = unknown>(knex: Knex, handler: (knex: Knex) => Promise<T>): Promise<T> => {
	if (knex.isTransaction) {
		return handler(knex);
	} else {
		return knex.transaction((trx) => handler(trx));
	}
};
