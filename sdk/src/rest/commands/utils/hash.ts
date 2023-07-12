import type { RestCommand } from '../../types.js';

/**
 * Generate a hash for a given string.
 * @param string String to hash.
 * @returns Hashed string.
 */
export const generateHash =
	<Schema extends object>(string: string): RestCommand<string, Schema> =>
	() => ({
		method: 'POST',
		path: `/utils/hash/generate`,
		body: JSON.stringify({ string }),
	});

/**
 * Verify a string with a hash.
 * @param string Source string.
 * @param hash Hash you want to verify against.
 * @returns Boolean.
 */
export const verifyHash =
	<Schema extends object>(string: string, hash: string): RestCommand<boolean, Schema> =>
	() => ({
		method: 'POST',
		path: `/utils/hash/verify`,
		body: JSON.stringify({ string, hash }),
	});
