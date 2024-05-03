import type { DirectusError } from './create-error.js';
import type { ExtensionsMap } from './types.js';

/**
 * Check whether or not a passed value is a valid Directus error.
 *
 * @param value - Any value
 * @param code - Error code to check for
 */
export const isDirectusError = <T = never, C extends string = string>(
	value: unknown,
	code?: C,
): value is DirectusError<[T] extends [never] ? (C extends keyof ExtensionsMap ? ExtensionsMap[C] : unknown) : T> => {
	const isDirectusError =
		typeof value === 'object' &&
		value !== null &&
		Array.isArray(value) === false &&
		'name' in value &&
		value.name === 'DirectusError';

	if (code) {
		return isDirectusError && 'code' in value && value.code === code.toUpperCase();
	}

	return isDirectusError;
};
