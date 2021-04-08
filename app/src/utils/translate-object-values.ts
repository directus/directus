import { computed, Ref } from '@vue/composition-api';
import { cloneDeep } from 'lodash';
import i18n from '@/lang';

export function translateReactive<T extends Object>(extensions: Ref<T>) {
	return computed({
		get() {
			return translate(cloneDeep(extensions.value));
		},
		set(newVal: T) {
			extensions.value = newVal;
		},
	});
}

export function translate<T extends Record<string, any>>(obj: T) {
	Object.entries(obj).forEach(([key, val]) => {
		if (val && typeof val === 'object') (obj as Record<string, any>)[key] = translate(val);
		if (val && typeof val === 'string' && val.startsWith('$t:'))
			(obj as Record<string, any>)[key] = i18n.t(val.replace('$t:', ''));
	});
	return obj;
}
