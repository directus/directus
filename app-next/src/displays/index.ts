import { ref, Ref } from 'vue';
import { DisplayConfig } from './types';

let displaysRaw: Ref<DisplayConfig[]>;
let displays: Ref<DisplayConfig[]>;

export function getDisplays() {
	if (!displaysRaw) {
		displaysRaw = ref([]);
	}

	if (!displays) {
		displays = ref([]);
	}

	return { displays, displaysRaw };
}
