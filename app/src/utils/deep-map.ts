import { transform, isPlainObject } from 'lodash';

// eslint-disable-next-line @typescript-eslint/ban-types
export function deepMap(obj: Record<string, any>, iterator: Function, context?: Function): any {
	return transform(obj, function (result: any, val, key) {
		result[key] = isPlainObject(val) ? deepMap(val, iterator, context) : iterator.call(context, val, key, obj);
	});
}
