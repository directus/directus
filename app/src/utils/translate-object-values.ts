import i18n from '@/lang';
import { cloneDeep } from 'lodash';

export function translate<T extends Record<string, any>>(obj: T) {
	obj = cloneDeep(obj);

	Object.entries(obj).forEach(([key, val]) => {
		if (val && typeof val === 'object') (obj as Record<string, any>)[key] = translate(val);
		if (val && typeof val === 'string' && val.startsWith('$t:'))
			(obj as Record<string, any>)[key] = i18n.t(val.replace('$t:', ''));
	});

	return obj;
}
