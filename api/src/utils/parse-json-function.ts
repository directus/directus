import { InvalidQueryException } from '../exceptions';
import { stripFunction } from './strip-function';

// export const JSON_QUERY_REGEX = /^(\w+)(\.(\w+|\*)|\[-?(\d+|\*)\])+$/i; // with negative indexes
export const JSON_QUERY_REGEX = /^(\w+)(\.(\w+|\*)|\[(\d+|\*)\])+$/i;

/**
 * Takes in a column name and parses it into its individual parts
 *
 * @example
 *
 * ```js
 * applyFunctionToColumnName('year(date_created)');
 * // => "date_created_year"
 * ```
 */
export function parseJsonFunction(column: string) {
	const content = stripFunction(column);
	if (!JSON_QUERY_REGEX.test(content)) {
		throw new InvalidQueryException(`The json query used is not valid. "${column}"`);
	}
	const contentEnd = content.length - 1;
	const pathStart = Math.min(
		content.includes('.') ? content.indexOf('.') : contentEnd,
		content.includes('[') ? content.indexOf('[') : contentEnd
	);
	const fieldName = content.substring(0, pathStart);
	const queryPath = '$' + content.substring(pathStart);
	return { fieldName, queryPath };
}
