import { i18n } from '@/lang';
import { cloneDeep } from 'lodash';

export function translate<T extends Record<string, any>>(obj: T): T {
	const newObj = cloneDeep(obj);

	Object.entries(newObj).forEach(([key, val]) => {
		if (val && typeof val === 'object') (newObj as Record<string, any>)[key] = translate(val);
		if (val && typeof val === 'string' && val.startsWith('$t:'))
			(newObj as Record<string, any>)[key] = i18n.global.t(val.replace('$t:', ''));
	});

	return newObj;
}
