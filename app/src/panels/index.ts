import { ref, Ref } from '@vue/composition-api';
import { PanelConfig } from './types';

let panelsRaw: Ref<PanelConfig[]>;
let panels: Ref<PanelConfig[]>;

export function getPanels(): Record<string, Ref<PanelConfig[]>> {
	if (!panelsRaw) {
		panelsRaw = ref([]);
	}

	if (!panels) {
		panels = ref([]);
	}

	return { panels, panelsRaw };
}
