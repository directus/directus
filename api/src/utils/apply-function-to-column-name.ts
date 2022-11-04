import { parseJsonFunction } from './parse-json-function';
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
			const { fieldName, jsonPath } = parseJsonFunction(column);
			const queryStr = jsonPath
				.replace(/[^a-z0-9\\.\\[\\]]/gi, '')
				.replace(/[^a-z0-9]+/gi, '_')
				.replace(/_$/, '');
			return `${functionName}_${fieldName}${queryStr}`;
		}
		const columnName = stripFunction(column);
		return `${columnName}_${functionName}`;
	} else {
		return column;
	}
}
