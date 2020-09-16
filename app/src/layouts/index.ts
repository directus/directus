import { ref, Ref } from '@vue/composition-api';
import { LayoutConfig } from './types';

let layouts: Ref<LayoutConfig[]>;

export function getLayouts() {
	if (!layouts) {
		layouts = ref([]);
	}

	return layouts;
}
