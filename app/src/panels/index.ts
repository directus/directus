import { shallowRef, Ref } from 'vue';
import { PanelConfig } from './types';

const panelsRaw: Ref<PanelConfig[]> = shallowRef([]);
const panels: Ref<PanelConfig[]> = shallowRef([]);

export function getPanels(): { panels: Ref<PanelConfig[]>; panelsRaw: Ref<PanelConfig[]> } {
	return { panels, panelsRaw };
}
