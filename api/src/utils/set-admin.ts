import { Accountability } from '@directus/shared/types';

export function setAdmin(accountability: Accountability | null = null) {
	if (accountability === null) return null;
	accountability.admin = true;
	return accountability;
}
