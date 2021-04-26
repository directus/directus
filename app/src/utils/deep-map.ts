import { transform, isPlainObject } from 'lodash';

export function deepMap(obj: Record<string, any>, iterator: Function, context?: Function) {
	return transform(obj, function (result: any, val, key) {
		result[key] = isPlainObject(val) ? deepMap(val, iterator, context) : iterator.call(context, val, key, obj);
	});
}
