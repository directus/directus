import { shallowRef, Ref } from 'vue';
import { ModuleConfig } from '@directus/shared/types';

const modulesRaw: Ref<ModuleConfig[]> = shallowRef([]);
const modules: Ref<ModuleConfig[]> = shallowRef([]);

export function getModules(): { modules: Ref<ModuleConfig[]>; modulesRaw: Ref<ModuleConfig[]> } {
	return { modules, modulesRaw };
}
