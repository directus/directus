import { shallowRef, Ref } from 'vue';
import { InterfaceConfig } from './types';

const interfacesRaw: Ref<InterfaceConfig[]> = shallowRef([]);
const interfaces: Ref<InterfaceConfig[]> = shallowRef([]);

export function getInterfaces(): Record<string, Ref<InterfaceConfig[]>> {
	return { interfaces, interfacesRaw };
}
