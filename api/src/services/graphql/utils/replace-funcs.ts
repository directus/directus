import { FUNCTIONS } from '@directus/constants';
import type { Filter } from '@directus/types';
import { transform } from 'lodash-es';

/**
 * Replace functions from GraphQL format to Directus-Filter format
 */
export function replaceFuncs(filter: Filter): Filter {
	return replaceFuncDeep(filter);

	function replaceFuncDeep(filter: Record<string, any>) {
		return transform(filter, (result: Record<string, any>, value, key) => {
			const isFunctionKey =
				typeof key === 'string' && key.endsWith('_func') && FUNCTIONS.includes(Object.keys(value)[0]! as any);

			if (isFunctionKey) {
				const functionName = Object.keys(value)[0]!;
				const fieldName = key.slice(0, -5);

				result[`${functionName}(${fieldName})`] = Object.values(value)[0]!;
			} else {
				result[key] = value?.constructor === Object || value?.constructor === Array ? replaceFuncDeep(value) : value;
			}
		});
	}
}
