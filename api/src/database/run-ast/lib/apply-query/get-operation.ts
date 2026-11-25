import { LOGICAL_FILTER_OPERATORS, RELATIONAL_FILTER_OPERATORS } from '@directus/constants';
import { isIn, isObject } from '@directus/utils';

/**
 * Returns the operator and value of a (nested) field filter, defaulting to _eq for a direct value.
 * Returns null when it reaches `{}` or _and/_or/_some/_none instead of an operator.
 *
 * Only use on filters normalized by `parseFilter` as this only checks the first key at each level and ignores the rest.
 *
 * @example
 *
 * ```js
 * getOperation('author', { name: { _in: ['a'] } });
 * // => { operator: '_in', value: ['a'] }
 *
 * getOperation('links', { _some: { name: { _eq: 'a' } } });
 * // => null
 * ```
 */
export function getOperation(key: string, value: unknown): { operator: string; value: unknown } | null {
	if (isIn(key, LOGICAL_FILTER_OPERATORS) || isIn(key, RELATIONAL_FILTER_OPERATORS)) return null;

	if (key.startsWith('_')) {
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
