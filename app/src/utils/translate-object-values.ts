import { translate as translateString } from './translate-literal';
import { cloneDeep } from 'lodash';

export function translate<T extends Record<string, any>>(obj: T): T {
	const newObj = cloneDeep(obj);

	Object.entries(newObj).forEach(([key, val]) => {
		if (val && typeof val === 'object') (newObj as Record<string, any>)[key] = translate(val);
		if (val && typeof val === 'string') (newObj as Record<string, any>)[key] = translateString(val);
	});

	return newObj;
}
