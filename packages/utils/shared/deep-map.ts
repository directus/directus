import { isObjectLike, isPlainObject } from 'lodash-es';

/**
 * Maps over all values in an array or object recursively and calls the callback on primitive values.
 * The called object will not be mutated. The callback will not be called for primitive values.
 *
 * @example
 * deepMap({a: 1, b: [2]}, (value) => String(value)) // {a: "1", b: ["2"]}
 */
export function deepMap(object: any, callback: (value: any, key: string | number) => any, context?: any): any {
	return recurse(object);

	function recurse(value: any, key?: string | number): any {
		if (Array.isArray(value)) {
			return value.map(recurse);
		} else if (isObjectLike(value) && isPlainObject(value)) {
			return Object.fromEntries(Object.entries(value).map(([key, val]) => [key, recurse(val, key)]));
		} else if (key !== undefined) {
			return callback.call(context, value, key);
		} else {
			// key is undefined on the top level so we don't want to map any values
			return value;
		}
	}
}
