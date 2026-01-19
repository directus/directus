import { REGEX_BETWEEN_PARENS } from '@directus/constants';

/**
 * Takes in a column name, and transforms the original name with the generated column name based on
 * the applied function.
 *
 * @example
 *
 * ```js
 * applyFunctionToColumnName('year(date_created)');
 * // => "date_created_year"
 * ```
 */
export function applyFunctionToColumnName(column: string): string {
	if (column.includes('(') && column.includes(')')) {
		const functionName = column.split('(')[0];
		const columnName = column.match(REGEX_BETWEEN_PARENS)![1];

		if (functionName === 'json') {
			return `${columnName?.replace(/\.|\[|\]/, '_')}_${functionName}`;
		} else {
			return `${columnName}_${functionName}`;
		}
	} else {
		return column;
	}
}
