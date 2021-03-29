import { computed, Ref } from '@vue/composition-api';
import { cloneDeep } from 'lodash';
import i18n from './lang';

export function translateExtensions(extensions: Ref<Extension[]>) {
	return computed({
		get() {
			return translateStrings(cloneDeep(extensions.value)) as Extension[];
		},
		set(newVal: Extension[]) {
			extensions.value = newVal;
		},
	});
}
function translateStrings(obj: Record<string, any>) {
	Object.entries(obj).forEach(([key, val]) => {
		if (val && typeof val === 'object') obj[key] = translateStrings(val);
		if (val && typeof val === 'string' && val.startsWith('$t:')) obj[key] = i18n.t(val.replace('$t:', ''));
	});
	return obj;
}

export interface Extension {
	id: string;
	name: string;
}
