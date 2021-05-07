import { shallowRef, Ref } from 'vue';
import { LayoutConfig } from './types';

const layoutsRaw: Ref<LayoutConfig[]> = shallowRef([]);
const layouts: Ref<LayoutConfig[]> = shallowRef([]);

export function getLayouts(): Record<string, Ref<LayoutConfig[]>> {
	return { layouts, layoutsRaw };
}
