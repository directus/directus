/**
 * Deepest path this will follow. Paths come from caller-supplied dynamic variables such as
 * `$CURRENT_USER.role.name`, so an unbounded one lets the caller choose how much work to do.
 *
 * Hardcoded rather than configurable: this package also ships to the browser and cannot read env.
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
	// Split once: re-splitting and rejoining the remainder per level would make the string work
	// quadratic in the number of segments
	const segments = path.split('.');

	if (segments.length > MAX_PATH_DEPTH) {
		return defaultValue;
	}

	let current: unknown = object;

	for (const [index, segment] of segments.entries()) {
		const key = segment.includes(':') ? segment.split(':')[0]! : segment;

		const result = Array.isArray(current)
			? getArrayResult(current, key)
			: (current as Record<string, any> | undefined)?.[key];

		if (result === undefined || index === segments.length - 1) {
			return result ?? defaultValue;
		}

		current = result;
	}

	return defaultValue;
}

function getArrayResult(object: unknown[], key: string): unknown[] | undefined {
	const result = object.map((entry) => entry?.[key as keyof unknown]).filter((entry) => entry);

	return result.length > 0 ? result.flat() : undefined;
}
