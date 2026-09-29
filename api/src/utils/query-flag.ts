import { toBoolean } from '@directus/utils';

/**
 * Read a boolean query flag. A bare `?flag` (empty string value) counts as true.
 */
export function queryFlag(value: unknown): boolean {
	return value === '' || toBoolean(value);
}
