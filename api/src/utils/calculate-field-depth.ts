import { isPlainObject, isArray } from 'lodash';

/**
 * Calculates the depth of a given JSON structure, not counting any _ prefixed properties
 *
 * Used to calculate the field depth in a filter or deep query structure
 *
 * @example
 *
 * ```js
 * const deep = {
 * 	translations: {
 * 		_filter: {
 * 			_and: [
 * 				{
 * 					language_id: {
 * 						name: {
 * 							_eq: 'English'
 * 						}
 * 					}
 * 				},
 * 				{
 * 					status: {
 * 						_eq: 'Published'
 * 					}
 * 				}
 * 			]
 * 		}
 * 	}
 * };
 *
 * const result = calculateFieldDepth(deep); // => 3
 * ```
 */
export function calculateFieldDepth(obj?: Record<string, any> | null): number {
	if (!obj) {
		return 0;
	}

	let depth = 0;

	const keys = Object.keys(obj);

	for (const key of keys) {
		const nestedValue = obj[key];

		if (!isPlainObject(nestedValue) && !isArray(nestedValue)) continue;

		let nestedDepth = 0;

		if (Array.isArray(nestedValue)) {
			nestedDepth = Math.max(...nestedValue.map(calculateFieldDepth));
		} else {
			nestedDepth = calculateFieldDepth(nestedValue);
		}

		if (key.startsWith('_') === false) nestedDepth += 1;

		if (nestedDepth > depth) {
			depth = nestedDepth;
		}
	}

	return depth;
}
