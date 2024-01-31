import type { AbstractQueryFunction } from '../common/function.js';

/**
 * Used to apply a function to a specific field before returning it.
 *
 * @example
 * There are several functions available.
 * Let's say you want to only return the year of a date field:
 * ```js
 * {
 * 	type: 'fn',
 * 	fn: 'year',
 * 	field: 'date_created'
 * }
 * ```
 */
export interface AbstractQueryFieldNodeFn extends AbstractQueryFunction {
	alias: string;
}
