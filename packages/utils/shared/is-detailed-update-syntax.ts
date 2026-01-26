import { isObject } from './is-object.js';

/**
 * Checks if a value is using the detailed update syntax for relational fields
 */
export function isDetailedUpdateSyntax(
	value: unknown,
): value is { create: unknown[]; update: unknown[]; delete: unknown[] } {
	if (!isObject(value)) return false;

	const keys = Object.keys(value);
	if (keys.length !== 3) return false;

	return (
		Array.isArray((value as any)['create']) &&
		Array.isArray((value as any)['update']) &&
		Array.isArray((value as any)['delete'])
	);
}
