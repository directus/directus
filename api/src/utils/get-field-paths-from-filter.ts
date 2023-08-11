import type { Filter } from '@directus/types';
import { isPlainObject, isArray } from 'lodash-es';

/**
 * Get the dot notation field paths of a Directus Filter, ignoring any _ prefixed properties
 *
 * @example
 *
 * ```js
 * const filter = {
 * 	_and: [
 * 		{
 * 			translations: {
 * 				language_id: {
 * 					_eq: 'English',
 * 				},
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
 * const result = getFieldPathsFromFilter(filter); // => ['translations.language_id', 'status']
 * ```
 */
export function getFieldPathsFromFilter(filter?: Filter | null, parentPath = ''): string[] {
	if (!filter) {
		return [];
	}

	const fieldPaths: string[] = [];
	const paths = Object.keys(filter);

	for (const path of paths) {
		const nestedFilter = (filter as Record<string, any>)[path];

		let currentPath = '';

		if (path.startsWith('_')) {
			currentPath = parentPath;
		} else {
			currentPath = parentPath ? `${parentPath}.${path}` : path;
		}

		if (!isPlainObject(nestedFilter) && !isArray(nestedFilter)) {
			fieldPaths.push(currentPath);
			continue;
		}

		if (Array.isArray(nestedFilter)) {
			const nestedKeys = nestedFilter.flatMap((val) => getFieldPathsFromFilter(val, currentPath));
			fieldPaths.push(...nestedKeys);
		} else {
			fieldPaths.push(...getFieldPathsFromFilter(nestedFilter, currentPath));
		}
	}

	return fieldPaths;
}
