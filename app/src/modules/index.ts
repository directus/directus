import { shallowRef, Ref } from 'vue';
import { ModuleConfig } from './types';

const modulesRaw: Ref<ModuleConfig[]> = shallowRef([]);
const modules: Ref<ModuleConfig[]> = shallowRef([]);

export function getModules(): Record<string, any> {
	return { modules, modulesRaw };
}
