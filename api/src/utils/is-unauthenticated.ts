import type { Accountability } from '@directus/types';

/**
 * Checks if the given accountability is unauthenticated
 *
 * @param accountability
 * @returns True if the user is unauthenticated, false otherwise.
 */
export function isUnauthenticated(accountability?: Accountability | null): boolean {
	// Backwards compatibility: if accountability is null, we consider it as admin
	if (accountability === null) {
		return false;
	}

	if (accountability === undefined) {
		return true;
	}

	return accountability?.role === null && accountability?.user === null;
}
