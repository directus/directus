import type { DirectusError } from './create-error.js';

/**
 * Check whether or not a passed thing is a valid Directus error
 *
 * @param err - Any input
 */
export const isDirectusError = <T = unknown>(err: unknown, code?: string): err is DirectusError<T> => {
	const isDirectusError =
		typeof err === 'object' &&
		err !== null &&
		Array.isArray(err) === false &&
		'name' in err &&
		err.name === 'DirectusError';

	if (code) {
		return isDirectusError && 'code' in err && err.code === code.toUpperCase();
	}

	return isDirectusError;
};
