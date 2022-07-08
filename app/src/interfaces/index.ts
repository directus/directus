import { shallowRef, Ref } from 'vue';
import { InterfaceConfig } from '@directus/shared/types';

const interfacesRaw: Ref<InterfaceConfig[]> = shallowRef([]);
const interfaces: Ref<InterfaceConfig[]> = shallowRef([]);

export function getInterfaces(): { interfaces: Ref<InterfaceConfig[]>; interfacesRaw: Ref<InterfaceConfig[]> } {
	return { interfaces, interfacesRaw };
}

export function getInterface(name?: string | null): InterfaceConfig | undefined {
	return !name ? undefined : interfaces.value.find(({ id }) => id === name);
}
