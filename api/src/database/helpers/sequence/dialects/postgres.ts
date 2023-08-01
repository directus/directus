import type { Knex } from 'knex';
import { AutoSequenceHelper } from '../types.js';

export class AutoIncrementHelperPostgres extends AutoSequenceHelper {
	/**
	 * Resets the auto increment sequence for a table based on the max value of the PK column.
	 * We're assuming that the default sequence name is being used,
	 * which is the `${tableName}_${columnName}_seq`.
	 */
	override resetAutoIncrementSequence(_table: string, _column: string): Knex.Raw | null {
		return this.knex.raw(`SELECT SETVAL('${_table}_${_column}_seq', (SELECT MAX(${_column}) FROM ${_table}));`);
	}
}
