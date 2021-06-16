import { Knex } from 'knex';
import { FunctionsHelper } from '../database/functions';
import { REGEX_BETWEEN_PARENS } from '../constants';

/**
 * Return column prefixed by table. If column includes functions (like `year(date_created)`, the
 * column is replaced with the appropriate SQL)
 *
 * @param knex Current knex / transaction instance
 * @param collection Collection or alias in which column resides
 * @param field name of the column
 * @returns Knex raw instance
 */
export function getColumn(knex: Knex, table: string, column: string): Knex.Raw {
	const fn = FunctionsHelper(knex);

	if (column.includes('(') && column.includes(')')) {
		const functionName = column.split('(')[0];
		const columnName = column.match(REGEX_BETWEEN_PARENS)![1];

		if (functionName in fn) {
			return fn[functionName as keyof typeof fn](table, columnName);
		} else {
			throw new Error(`Invalid function specified "${functionName}"`);
		}
	}

	return knex.raw('??.??', [table, column]);
}
