import type { DirectusError } from './create-error.js';

/**
 * Check whether or not a passed thing is a valid Directus error
 *
 * @param err - Any input
 */
export const isDirectusError = (err: unknown): err is DirectusError<unknown> => {
	return (
		typeof err === 'object' &&
		err !== null &&
		Array.isArray(err) === false &&
		'name' in err &&
		err.name === 'DirectusError'
	);
};
