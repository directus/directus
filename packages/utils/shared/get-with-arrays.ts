/**
 * Paths come from caller-supplied dynamic variables like `$CURRENT_USER.role.name`, so an
 * unbounded one lets the caller choose how much work to do. Not configurable: this package also
 * ships to the browser and cannot read env.
 */
const MAX_PATH_DEPTH = 25;

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
	// Split once: re-splitting the remainder per level would be quadratic in the segment count
	const segments = path.split('.');

	if (segments.length > MAX_PATH_DEPTH) {
		return defaultValue;
	}

	let current: any = object;

	for (const segment of segments) {
		if (current === undefined || current === null) return defaultValue;

		const key = segment.split(':')[0]!;

		current = Array.isArray(current) ? getArrayResult(current, key) : current[key];
	}

	return current ?? defaultValue;
}

function getArrayResult(object: unknown[], key: string): unknown[] | undefined {
	const result = object.map((entry) => entry?.[key as keyof unknown]).filter((entry) => entry);

	return result.length > 0 ? result.flat() : undefined;
}
