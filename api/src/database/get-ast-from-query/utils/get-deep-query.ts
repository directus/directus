import { mapKeys, omitBy } from 'lodash-es';

/**
 * Convert Deep query object to regular query object by ignoring all nested fields and returning the
 * `_` prefixed fields as top level query fields
 *
 * @example
 *
 * ```js
 * getDeepQuery({
 *   _sort: ['a']
 * });
 * // => { sort: ['a'] }
 * ```
 */
export function getDeepQuery(query: Record<string, any>): Record<string, any> {
	return mapKeys(
		omitBy(query, (_value, key) => key.startsWith('_') === false),
		(_value, key) => key.substring(1),
	);
}
