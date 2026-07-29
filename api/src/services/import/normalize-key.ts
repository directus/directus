import type { PrimaryKey } from '@directus/types';

/**
 * Normalize a primary key for comparison.
 */
export function normalizeKey(value: PrimaryKey): string {
	return String(value).toLowerCase();
}
