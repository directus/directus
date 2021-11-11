import { isObjectLike, flattenDeep } from 'lodash';

export function flattenArrays(obj: any) {
	for (const key in obj) {
		if (Array.isArray(obj[key])) {
			obj[key] = flattenDeep(obj[key]);
		} else if (isObjectLike(obj[key])) {
			obj[key] = flattenArrays(obj[key]);
		}
	}
	return obj;
}
