/**
 * Basically the same as `get` from `lodash`, but will convert nested array values to arrays, so for example:
 *
 * @example
 * ```js
 * const obj = { value: [{ example: 1 }, { example: 2 }]}
 * get(obj, 'value.example');
 * // => [1, 2]
 * ```
 *
 * A numeric segment indexes into an array instead of spreading across it, supporting both bracket
 * and dot notation:
 *
 * @example
 * ```js
 * const obj = { value: [{ example: 1 }, { example: 2 }]}
 * get(obj, 'value[0].example');
 * // => 1
 * get(obj, 'value.1.example');
 * // => 2
 * ```
 */
export function get(object: Record<string, any> | any[], path: string, defaultValue?: unknown): any {
	// Normalize bracket index access (e.g. `value[0]`) to dot notation (`value.0`) so index
	// segments are handled uniformly regardless of which syntax the template used.
	const normalizedPath = path.replace(/\[(\d+)\]/g, '.$1');

	let key = normalizedPath.split('.')[0]!;
	const follow = normalizedPath.split('.').slice(1);

	if (key.includes(':')) key = key.split(':')[0]!;

	let result;

	if (Array.isArray(object)) {
		// A numeric segment indexes into the array (e.g. `value[0]`), while any other key is
		// spread across every entry (e.g. `value.example` => all `example` values).
		result = isArrayIndex(key) ? object[Number(key)] : getArrayResult(object, key);
	} else {
		result = object?.[key];
	}

	if (result !== undefined && follow.length > 0) {
		return get(result, follow.join('.'), defaultValue);
	}

	return result ?? defaultValue;
}

function isArrayIndex(key: string): boolean {
	return /^\d+$/.test(key);
}

function getArrayResult(object: unknown[], key: string): unknown[] | undefined {
	const result = object.map((entry) => entry?.[key as keyof unknown]).filter((entry) => entry);

	return result.length > 0 ? result.flat() : undefined;
}
