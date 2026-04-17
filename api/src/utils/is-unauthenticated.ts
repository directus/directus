import type { Accountability } from '@directus/types';

/**
 * Checks if the given accountability is unauthenticated (i.e. has no role and no user).
 *
 * @param accountability
 * @returns True if the user is unauthenticated, false otherwise.
 */
export function isUnauthenticated(accountability?: Accountability): boolean {
	return accountability?.role === null && accountability?.user === null;
}
