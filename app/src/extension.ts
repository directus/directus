import { computed, Ref } from '@vue/composition-api';
import { cloneDeepWith } from 'lodash';
import i18n from './lang';

export function translateExtensions(extensions: Ref<Extension[]>) {
	return computed(() => cloneDeepWith(extensions.value, translateStrings));
}
function translateStrings(obj: Record<string, any>) {
	Object.entries(obj).forEach(([key, val]) => {
		if (typeof val === 'string' && val.startsWith('$t:')) obj[key] = i18n.t(obj[key]);
	});
	return obj;
}

export interface Extension {
	id: string;
	name: string;
}
