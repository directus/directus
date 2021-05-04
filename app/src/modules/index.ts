import { ref, Ref } from '@vue/composition-api';
import { ModuleConfig } from './types';

let modulesRaw: Ref<ModuleConfig[]>;
let modules: Ref<ModuleConfig[]>;

export function getModules(): Record<string, any> {
	if (!modulesRaw) {
		modulesRaw = ref([]);
	}

	if (!modules) {
		modules = ref([]);
	}

	return { modules, modulesRaw };
}
