import type { Accountability } from '@directus/types';

export function isAdmin(accountability?: Accountability | null) {
	// system
	if (accountability === null) return true;

	// admin
	if (accountability?.admin === true) return true;

	// fallback
	return false;
}
