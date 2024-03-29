import type { Knex } from 'knex';

/**
 * Execute the given callback in a transaction if the current knex state isn't a transaction yet.
 *
 * Can be used to ensure the nested callback is run within a transaction, without nesting
 * transactions
 */
export const transaction = async <T = unknown>(knex: Knex, callback: (knex: Knex) => Promise<T>): Promise<T> => {
	if (knex.isTransaction) {
		return await callback(knex);
	} else {
		return await knex.transaction(async (trx) => await callback(trx));
	}
};
