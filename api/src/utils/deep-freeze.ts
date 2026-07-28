import { isPlainObject } from 'lodash-es';

/**
 * Recursively freezes arrays and plain objects so the entire structure is immutable.
 *
 * @example
 * const frozen = deepFreeze({ a: { b: 1 } });
 * frozen.a.b = 2; // throws in strict mode
 */
export function deepFreeze<T>(value: T): T {
	if (Array.isArray(value)) {
		for (const item of value) {
			deepFreeze(item);
		}

		return Object.freeze(value) as T;
	}

	if (isPlainObject(value)) {
		for (const item of Object.values(value as object)) {
			deepFreeze(item);
		}

		return Object.freeze(value) as T;
	}

	return value as T;
}
