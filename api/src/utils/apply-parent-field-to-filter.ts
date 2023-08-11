import type { Filter } from '@directus/types';

/**
 * Apply a top level parent field to a Directus Filter, ignoring any _ prefixed properties until it is applied
 *
 * @example
 *
 * ```js
 * const filter = {
 * 	_and: [
 * 		{
 * 			language_id: {
 * 				_eq: 'English',
 * 			},
 * 		},
 * 		{
 * 			status: {
 * 				_eq: 'Published',
 * 			},
 * 		},
 * 	],
 * };
 *
 * const result = applyParentFieldToFilter(filter, 'translations');
 * // => {
 * //	_and: [
 * //		{
 * //			translations: {
 * //				language_id: {
 * //					_eq: 'English',
 * //				},
 * //			},
 * //		},
 * //		{
 * //			translations: {
 * //				status: {
 * //					_eq: 'Published',
 * //				},
 * //			},
 * //		},
 * // 	],
 * // };
 * ```
 */
export function applyParentFieldToFilter(parentPath: string, filter?: Filter | null) {
	if (!filter) {
		return filter;
	}

	return processFilter(filter, true);

	function processFilter(obj: Record<string, any>, isRoot: boolean) {
		const processedFilter: Record<string, any> = isRoot ? { _and: [] } : {};
		const paths = Object.keys(obj);

		for (const path of paths) {
			const nestedFilter = obj[path];

			if (path.startsWith('_')) {
				if (Array.isArray(nestedFilter)) {
					processedFilter[path] = nestedFilter.map((val) => processFilter(val, false));
				} else {
					processedFilter[path] = processFilter(nestedFilter, false);
				}

				continue;
			}

			if (isRoot) {
				processedFilter['_and']!.push({
					[parentPath]: { [path]: nestedFilter },
				});
			} else {
				processedFilter[parentPath] = { [path]: nestedFilter };
			}
		}

		return processedFilter as Filter;
	}
}
