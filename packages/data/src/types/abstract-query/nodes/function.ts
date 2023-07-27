import type { AbstractQueryNode } from '../abstract-query.js';
import type { AbstractQueryFieldNodePrimitive } from './primitive.js';

export type SupportedFunctions = 'year' | 'month' | 'week' | 'day' | 'weekday' | 'hour' | 'minute' | 'second' | 'count';

/**
 * Used to apply a function to a specific field before returning it.
 * @example
 * There are several functions available.
 * Let's say you want to only return the year of a date field:
 * ```js
 * const functionNode: AbstractQueryFieldNodeFn = {
 * 	type: 'fn',
 * 	fn: 'year',
 * 	targetNode: {
 * 	type: 'primitive',
 * 	field: 'date_created'
 * }
 * ```
 */
export interface AbstractQueryFieldNodeFn extends AbstractQueryNode {
	type: 'fn';

	fn: SupportedFunctions;

	targetNode: AbstractQueryFieldNodePrimitive | AbstractQueryFieldNodeFn;

	args?: (string | number | boolean)[];

	alias?: string;
}
