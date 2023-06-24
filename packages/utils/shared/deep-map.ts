import { isObjectLike } from 'lodash-es';

export function deepMap(object: any, iterator: (value: any, key: string | number) => any, context?: any): any {
	if (Array.isArray(object)) {
		return object.map(function (val, key) {
			return isObjectLike(val) ? deepMap(val, iterator, context) : iterator.call(context, val, key);
		});
	} else if (isObjectLike(object)) {
		const res: Record<string, any> = {};

		for (const key in object) {
			const val = object[key];

			if (isObjectLike(val)) {
				res[key] = deepMap(val, iterator, context);
			} else {
				res[key] = iterator.call(context, val, key);
			}
		}

		return res;
	} else {
		return object;
	}
}
