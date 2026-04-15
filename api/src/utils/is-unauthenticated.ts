import type { Accountability } from '@directus/types';

export function isUnauthenticated(accountability?: Accountability | null) {
	return accountability?.role === null && accountability?.user === null;
}
