import type { Knex } from 'knex';
import { AutoSequenceHelper } from '../types.js';

export class AutoIncrementHelperPostgres extends AutoSequenceHelper {
	/**
	 * Resets the auto increment sequence for a table based on the max value of the PK column.
	 * The sequence name of determined using a sub query.
	 */
	override async resetAutoIncrementSequence(table: string, column: string): Promise<Knex.Raw | void> {
		return await this.knex.raw(
			`WITH sequence_infos AS (SELECT pg_get_serial_sequence('${table}', '${column}') AS seq_name, MAX(${column}) as max_val FROM ${table}) SELECT SETVAL(seq_name, max_val) FROM sequence_infos;`
		);
	}
}
