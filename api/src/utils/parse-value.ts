import { parseJSON } from '@directus/utils';

/**
 * Parse a value that might be a JSON string, returning a typed result or fallback.
 */
export function parseValue<T>(value: unknown, fallback: T): T {
	if (!value) return fallback;
	if (typeof value === 'string') return parseJSON(value);
	return value as T;
}
