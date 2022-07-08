import { shallowRef, Ref } from 'vue';
import { PanelConfig } from '@directus/shared/types';

const panelsRaw: Ref<PanelConfig[]> = shallowRef([]);
const panels: Ref<PanelConfig[]> = shallowRef([]);

export function getPanels(): { panels: Ref<PanelConfig[]>; panelsRaw: Ref<PanelConfig[]> } {
	return { panels, panelsRaw };
}

export function getPanel(name?: string | null): PanelConfig | undefined {
	return !name ? undefined : panels.value.find(({ id }) => id === name);
}
