import { isObject } from '@directus/utils';

/**
 * Returns null or the operation information form a FieldFilter
 */
export function getOperation(key: string, value: unknown): { operator: string; value: unknown } | null {
	if (key === '_and' || key === '_or') return null;

	if (key.startsWith('_') && key !== '_none' && key !== '_some') {
		return { operator: key, value };
	} else if (!isObject(value)) {
		return { operator: '_eq', value };
	}

	const childKey = Object.keys(value)[0];

	if (childKey) {
		// When _none/_some contains a logical operator (_and/_or) as its immediate child,
		// recursing further would return null (because getOperation returns null for _and/_or),
		// which causes the entire _none/_some filter to be skipped via `if (!operation) continue`.
		// This happens when parseFilter wraps multiple sub-filters in an implicit _and.
		// Return a sentinel value here — the actual subfilter is handled by the _none/_some
		// handler in addWhereClauses, which reads the value directly from the original filter
		// object and never uses this operation result.
		if ((key === '_none' || key === '_some') && (childKey === '_and' || childKey === '_or')) {
			return { operator: key, value };
		}

		return getOperation(childKey, Object.values(value)[0]);
	}

	return null;
}
