import type { RestCommand } from '../../types.js';

/**
 * Returns a random string of given length.
 * @param length The length of the generated string
 * @returns Generated string
 */
export const randomString =
	<Schema>(length?: number): RestCommand<string, Schema> =>
	() => ({
		method: 'GET',
		path: `/utils/random/string`,
		params: length !== undefined ? { length } : {},
	});
