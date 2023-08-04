import type { Knex } from 'knex';
import { AutoSequenceHelper } from '../types.js';

export class AutoIncrementHelperPostgres extends AutoSequenceHelper {
	/**
	 * Resets the auto increment sequence for a table based on the max value of the PK column.
	 * We're assuming that the default sequence name is being used,
	 * which is the `${tableName}_${columnName}_seq`.
	 */
	override async resetAutoIncrementSequence(table: string, column: string): Promise<Knex.Raw | void> {
		return await this.knex.raw(`select setval('${table}_${column}_seq', (select max(${column}) from ${table}));`);
	}
}
