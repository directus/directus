import { shallowRef, Ref } from 'vue';
import { LayoutConfig } from '@directus/shared/types';

const layoutsRaw: Ref<LayoutConfig[]> = shallowRef([]);
const layouts: Ref<LayoutConfig[]> = shallowRef([]);

export function getLayouts(): { layouts: Ref<LayoutConfig[]>; layoutsRaw: Ref<LayoutConfig[]> } {
	return { layouts, layoutsRaw };
}

export function getLayout(name?: string | null): LayoutConfig | undefined {
	return !name ? undefined : layouts.value.find(({ id }) => id === name);
}
