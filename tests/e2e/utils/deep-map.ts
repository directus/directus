import { isObjectLike, isPlainObject } from 'lodash-es';

// Modified from @directus/utils
export function deepMap(
	object: any,
	callback: (key: string | number, value: any) => [key: string | number, any],
	context?: any,
): any {
	return recurse(object)[1];

	function recurse(value: any, key?: string | number): [key: string | number | undefined, any] {
		if (Array.isArray(value)) {
			return [key, value.map((val, key) => recurse(val, key)[1])];
		} else if (isObjectLike(value) && isPlainObject(value)) {
			return [key, Object.fromEntries(Object.entries(value).map(([key, val]) => recurse(val, key)))];
		} else if (key !== undefined) {
			return callback.call(context, key, value);
		} else {
			// key is undefined on the top level so we don't want to map any values
			return [key, value];
		}
	}
}
