/**
 * Basically the same as `get` from `lodash`, but will convert nested array values to arrays, so for example:
 *
 * @example
 * ```js
 * const obj = { value: [{ example: 1 }, { example: 2 }]}
 * get(obj, 'value.example');
 * // => [1, 2]
 * ```
 */
export function get(object: Record<string, any> | any[], path: string, defaultValue?: unknown): any {
	let key = path.split('.')[0]!;
	const follow = path.split('.').slice(1);

	if (key.includes(':')) key = key.split(':')[0]!;

	const result = Array.isArray(object) ? object.map((entry) => entry?.[key]).filter((entry) => entry) : object?.[key];

	if (follow.length > 0) {
		return get(result, follow.join('.'), defaultValue);
	}

	return result ?? defaultValue;
}
