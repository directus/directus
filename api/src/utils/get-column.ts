import { Knex } from 'knex';
import { getHelpers } from '../database/helpers';
import { REGEX_BETWEEN_PARENS } from '@directus/shared/constants';
import { applyFunctionToColumnName } from './apply-function-to-column-name';

/**
 * Return column prefixed by table. If column includes functions (like `year(date_created)`, the
 * column is replaced with the appropriate SQL)
 *
 * @param knex Current knex / transaction instance
 * @param collection Collection or alias in which column resides
 * @param field name of the column
 * @param alias Whether or not to add a SQL AS statement
 * @returns Knex raw instance
 */
export function getColumn(
	knex: Knex,
	table: string,
	column: string,
	alias: string | false = applyFunctionToColumnName(column)
): Knex.Raw {
	const { date: fn } = getHelpers(knex);

	if (column.includes('(') && column.includes(')')) {
		const functionName = column.split('(')[0];
		const columnName = column.match(REGEX_BETWEEN_PARENS)![1];

		if (functionName in fn) {
			const result = fn[functionName as keyof typeof fn](table, columnName) as Knex.Raw;

			if (alias) {
				return knex.raw(result + ' AS ??', [alias]);
			}

			return result;
		} else {
			throw new Error(`Invalid function specified "${functionName}"`);
		}
	}

	if (alias && column !== alias) {
		return knex.ref(`${table}.${column}`).as(alias);
	}

	return knex.ref(`${table}.${column}`);
}
