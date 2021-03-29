import { translateExtensions } from '@/extension';
import { ref, Ref } from '@vue/composition-api';
import { ModuleConfig } from './types';

let modules: Ref<ModuleConfig[]>;

export function getModules() {
	if (!modules) {
		modules = ref([]);
	}

	return translateExtensions(modules);
}
