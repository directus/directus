import type { Accountability } from '@directus/types';

/**
 * True for the system (`null`) and for an admin accountability.
 *
 * The predicate only describes the positive case, so the negative branch narrows to a plain,
 * non-null `Accountability`.
 */
export function isAdmin(
	accountability?: Accountability | null,
): accountability is null | (Accountability & { admin: true }) {
	// system
	if (accountability === null) return true;

	// admin
	if (accountability?.admin === true) return true;

	// fallback
	return false;
}
