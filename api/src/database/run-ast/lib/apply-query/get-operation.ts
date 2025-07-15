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
		return getOperation(childKey, Object.values(value)[0]);
	}

	return null;
}
