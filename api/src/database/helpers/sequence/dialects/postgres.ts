import type { Knex } from 'knex';
import { AutoSequenceHelper } from '../types.js';
import logger from '../../../../logger.js';

export class AutoIncrementHelperPostgres extends AutoSequenceHelper {
	/**
	 * Resets the auto increment sequence for a table based on the max value of the PK column.
	 * We're assuming that the default sequence name is being used,
	 * which is the `${tableName}_${columnName}_seq`.
	 */
	override async resetAutoIncrementSequence(table: string, column: string): Promise<Knex.Raw | void> {
		logger.trace(
			`Resetting auto_increment sequence for table "${table}": SELECT SETVAL('${table}_${column}_seq', (SELECT MAX(${column}) FROM ${table})); `
		);

		return await this.knex.raw(`SELECT SETVAL('${table}_${column}_seq', (SELECT MAX(${column}) FROM ${table}));`);
	}
}
