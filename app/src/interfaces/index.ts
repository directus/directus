import { ref, Ref } from '@vue/composition-api';
import { InterfaceConfig } from './types';

let interfaces: Ref<InterfaceConfig[]>;

export function getInterfaces() {
	if (!interfaces) {
		interfaces = ref([]);
	}

	return interfaces;
}
