import { router } from '@/router';
import { usePermissionsStore } from '@/stores/permissions';
import { useUserStore } from '@/stores/user';
import RouterPass from '@/utils/router-passthrough';
import { ModuleConfig } from '@directus/shared/types';
import { useAppStore } from '@/stores/app';
import { ShallowRef, shallowRef, watch } from 'vue';

export function getInternalModules(): ModuleConfig[] {
	const modules = import.meta.globEager('./*/index.ts');

	return Object.values(modules).map((module) => module.default);
}

export function registerModules(modules: ModuleConfig[]): ShallowRef<ModuleConfig[]> {
	const appStore = useAppStore();

	const registeredModules = shallowRef<ModuleConfig[]>([]);

	watch(
		() => appStore.hydrated,
		async (hydrated) => {
			if (hydrated) {
				registeredModules.value = [];

				const userStore = useUserStore();
				const permissionsStore = usePermissionsStore();

				for (const module of modules) {
					if (!userStore.currentUser) continue;

					if (module.preRegisterCheck) {
						const allowed = await module.preRegisterCheck(userStore.currentUser, permissionsStore.permissions);

						if (allowed) {
							registeredModules.value.push(module);
						}
					} else {
						registeredModules.value.push(module);
					}
				}

				for (const module of registeredModules.value) {
					router.addRoute({
						name: module.id,
						path: `/${module.id}`,
						component: RouterPass,
						children: module.routes,
					});
				}
			} else {
				for (const module of modules) {
					router.removeRoute(module.id);
				}

				registeredModules.value = [];
			}
		}
	);

	return registeredModules;
}
