/**
 * Resolve a template field path against an item, like `get` from `@directus/utils`, but with support
 * for array index access (`field[0]` or `field.0`).
 *
 * This intentionally lives in the app rather than `@directus/utils`: the shared `get` is also used by
 * the permission filter parser (`parse-filter`) on the backend, where a numeric path segment must
 * keep resolving as it always has. Index support is only meaningful when rendering a template, so it
 * is scoped to the rendering layer here.
 *
 * Behaviour matches the shared `get` except that a numeric segment indexes into an array instead of
 * being spread across every entry:
 *
 * @example
 * ```js
 * const obj = { value: [{ example: 1 }, { example: 2 }] };
 * getWithArrayIndex(obj, 'value.example');    // => [1, 2]   (spread, unchanged)
 * getWithArrayIndex(obj, 'value[0].example'); // => 1        (indexed)
 * getWithArrayIndex(obj, 'value.1.example');  // => 2        (indexed)
 * ```
 */
export function getWithArrayIndex(object: Record<string, any> | any[], path: string, defaultValue?: unknown): any {
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
		return getWithArrayIndex(result, follow.join('.'), defaultValue);
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
