import { ref, Ref } from '@vue/composition-api';
import { LayoutConfig } from './types';

let layoutsRaw: Ref<LayoutConfig[]>;
let layouts: Ref<LayoutConfig[]>;

export function getLayouts(): Record<string, Ref<LayoutConfig[]>> {
	if (!layoutsRaw) {
		layoutsRaw = ref([]);
	}

	if (!layouts) {
		layouts = ref([]);
	}

	return { layouts, layoutsRaw };
}
