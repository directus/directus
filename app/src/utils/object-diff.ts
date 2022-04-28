// checks to see for changes from obj1 to obj2
// does not check for changes from obj2 to obj1

import { isEqual } from 'lodash';

export const objDiff = (obj1: Record<any, any>, obj2: Record<any, any>) => {
	if (!obj1 || !obj2) return {};

	const diff: Record<any, any> = {};

	for (const [k, v] of Object.entries(obj2)) {
		if (!isEqual(v, obj1[k])) diff[k] = v;
	}
	return diff;
};
