/**
 * Takes in a column name, and a (potential) function name and transforms the original name with
 * the generated column name based on the applied function.
 *
 * @example
 *
 * ```js
 * applyFunctionToColumnName('year(date_created)');
 * // => "date_created_year"
 * ```
 */
export function applyFunctionToColumnName(column: string, func: string): string {
	return column + '_' + func;
}
