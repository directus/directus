import { Knex } from 'knex';
import { getHelpers } from '../database/helpers';
import { parseColumn } from './parse-column';
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
export function getColumn(knex: Knex, table: string, columnExpr: string, alias?: string | false): Knex.Raw {
	const helpers = getHelpers(knex);
	const { func, column } = parseColumn(columnExpr);
	if (func) {
		if (func in helpers.date) {
			const res = helpers.date[func as keyof typeof helpers.date](table, column);
			return knex.raw(res + 'AS ??', applyFunctionToColumnName(column, func));
		} else {
			throw new Error(`Invalid function specified "${func}"`);
		}
	}

	if (alias && column !== alias) {
		return knex.ref(`${table}.${column}`).as(alias);
	}

	return knex.ref(`${table}.${column}`);
}
