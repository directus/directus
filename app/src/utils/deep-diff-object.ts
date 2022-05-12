import { transform, isEqual, isEqualWith, isPlainObject, merge } from 'lodash';

/**
 * Adapted from https://gist.github.com/Yimiprod/7ee176597fef230d1451
 *
 * Strips all keys out of deviation that are equal to the same keys in base.
 *
 * @param  {Object} base      Object to compare with
 * @param  {Object} deviation Object with changes
 * @return {Object}           Values/nested objects from deviation that differed from
 *                            base object. Ignores keys that did not exist in base.
 */
export function deepDiff(
	base: Record<string, any>,
	deviation: Record<string, any>,
	caseSensitive = false
): Record<string, any> {
	const diff = transform(
		/**
		 * Merge to ensure deviation has all of the same keys as base. Could
		 * get empty output otherwise.
		 *
		 * Due to how lodash merge works, this could cause issues in the event
		 * that values are arrays of objects. The output value would be a merge
		 * of the objects nested therein. For our purposes, there's no need
		 * to account for this right now.
		 */
		merge({}, base, deviation),
		function (result: any, value: any, key: string) {
			if (base[key] !== undefined && !isEqualWith(base[key], value, handleCaseSensitivity(caseSensitive))) {
				result[key] = isPlainObject(value) && isPlainObject(base[key]) ? deepDiff(base[key], value) : value;
			}
		},
		{}
	);
	return diff;
}

function handleCaseSensitivity(caseSensitive = false) {
	return (valA: any, valB: any) => {
		if (typeof valA === 'string' && typeof valB === 'string') {
			if (caseSensitive) {
				return isEqual(valA, valB);
			}
			return isEqual(valA.toLocaleLowerCase(), valB.toLocaleLowerCase());
		}
		// Undefined in isEqualWith falls back to default isEqual function
		return undefined;
	};
}
