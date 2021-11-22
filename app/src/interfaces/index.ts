import { shallowRef, Ref } from 'vue';
import { InterfaceConfig } from '@directus/shared/types';

const interfacesRaw: Ref<InterfaceConfig[]> = shallowRef([]);
const interfaces: Ref<InterfaceConfig[]> = shallowRef([]);

export function getInterfaces(): { interfaces: Ref<InterfaceConfig[]>; interfacesRaw: Ref<InterfaceConfig[]> } {
	return { interfaces, interfacesRaw };
}
