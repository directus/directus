import { ref, Ref } from '@vue/composition-api';
import { DisplayConfig } from './types';

let displays: Ref<DisplayConfig[]>;

export function getDisplays() {
	if (!displays) {
		displays = ref([]);
	}

	return displays;
}
