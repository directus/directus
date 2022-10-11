import { REGEX_BETWEEN_PARENS } from '@directus/shared/constants';
import { stripFunction } from './strip-function';

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
		if (functionName === 'json') {
			const jsonQuery = stripFunction(column);
			const pathStart = Math.min(
				jsonQuery.includes('.') ? jsonQuery.indexOf('.') : Number.MAX_SAFE_INTEGER,
				jsonQuery.includes('[') ? jsonQuery.indexOf('[') : Number.MAX_SAFE_INTEGER
			);
			const columnName = jsonQuery.substring(0, pathStart);
			return `${columnName}_${functionName}`;
		}
		const columnName = stripFunction(column);
		return `${columnName}_${functionName}`;
	} else {
		return column;
	}
}
