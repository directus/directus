import { router } from '@/router';
import { usePermissionsStore } from '@/stores/permissions';
import { useUserStore } from '@/stores/user';
import RouterPass from '@/utils/router-passthrough';
import { getModules } from './index';
import { ModuleConfig } from '@directus/shared/types';
import { getExtensions } from '@/extensions';

const { modulesRaw } = getModules();

let queuedModules: ModuleConfig[] = [];

export function loadModules(): void {
	const moduleModules = import.meta.globEager('./*/index.ts');

	const modules: ModuleConfig[] = Object.values(moduleModules).map((module) => module.default);

	const customModules = getExtensions('module');
	modules.push(...customModules);

	queuedModules = modules;
}

export async function register(): Promise<void> {
	const userStore = useUserStore();
	const permissionsStore = usePermissionsStore();

	const registeredModules = [];

	for (const mod of queuedModules) {
		if (!userStore.currentUser) continue;

		if (mod.preRegisterCheck) {
			const allowed = await mod.preRegisterCheck(userStore.currentUser, permissionsStore.permissions);
			if (allowed) registeredModules.push(mod);
		} else {
			registeredModules.push(mod);
		}
	}

	for (const module of registeredModules) {
		router.addRoute({
			name: module.id,
			path: `/${module.id}`,
			component: RouterPass,
			children: module.routes,
		});
	}

	modulesRaw.value = registeredModules;
}

export function unregister(): void {
	for (const module of modulesRaw.value) {
		router.removeRoute(module.id);
	}

	modulesRaw.value = [];
}
