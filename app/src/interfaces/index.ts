import { ref, Ref } from '@vue/composition-api';
import { InterfaceConfig } from './types';

let interfacesRaw: Ref<InterfaceConfig[]>;
let interfaces: Ref<InterfaceConfig[]>;

export function getInterfaces(): Record<string, Ref> {
	if (!interfacesRaw) {
		interfacesRaw = ref([]);
	}

	if (!interfaces) {
		interfaces = ref([]);
	}

	return { interfaces, interfacesRaw };
}
