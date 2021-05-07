import { shallowRef, Ref } from 'vue';
import { DisplayConfig } from './types';

const displaysRaw: Ref<DisplayConfig[]> = shallowRef([]);
const displays: Ref<DisplayConfig[]> = shallowRef([]);

export function getDisplays(): Record<string, Ref> {
	return { displays, displaysRaw };
}
