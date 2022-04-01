import { isObjectLike } from 'lodash';

export function deepMap(
	// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
	object: any,
	iterator: (value: any, key: string | number) => any,
	// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
	context?: any
): any {
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
