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
	const [key, ...follow] = path.split('.');

	const result = Array.isArray(object) ? object.map((entry) => entry?.[key!]) : object?.[key!];

	if (follow.length > 0) {
		return get(result, follow.join('.'), defaultValue);
	}

	return result ?? defaultValue;
}
