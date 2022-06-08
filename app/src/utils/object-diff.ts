// Not reversible
import { isEqual } from 'lodash';

export const objDiff = (obj1: Record<any, any>, obj2: Record<any, any> | undefined) => {
	if (!obj1) return {};
	if (!obj2) return obj1;

	const diff: Record<any, any> = {};

	for (const [k, v] of Object.entries(obj1)) {
		if (!isEqual(v, obj2[k])) diff[k] = v;
	}

	return diff;
};
