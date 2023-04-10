import { router } from '@/router';
import { usePermissionsStore } from '@/stores/permissions';
import { useUserStore } from '@/stores/user';
import RouterPass from '@/utils/router-passthrough';
import { ModuleConfig } from '@directus/types';
import { ShallowRef, shallowRef } from 'vue';
import { sortBy } from 'lodash';

export function getInternalModules(): ModuleConfig[] {
	const modules = import.meta.glob<ModuleConfig>('./*/index.ts', { import: 'default', eager: true });

	return sortBy(Object.values(modules), 'id');
}

export function registerModules(modules: ModuleConfig[]): {
	registeredModules: ShallowRef<ModuleConfig[]>;
	onHydrateModules: () => Promise<void>;
	onDehydrateModules: () => Promise<void>;
} {
	const registeredModules = shallowRef<ModuleConfig[]>([]);

	const onHydrateModules = async () => {
		const userStore = useUserStore();
		const permissionsStore = usePermissionsStore();

		if (!userStore.currentUser) return;

		registeredModules.value = (
			await Promise.all(
				modules.map(async (module) => {
					if (!module.preRegisterCheck) return module;

					const allowed = await module.preRegisterCheck(userStore.currentUser, permissionsStore.permissions);

					if (allowed) return module;

					return null;
				})
			)
		).filter((module): module is ModuleConfig => module !== null);

		for (const module of registeredModules.value) {
			router.addRoute({
				name: module.id,
				path: `/${module.id}`,
				component: RouterPass,
				children: module.routes,
			});
		}
	};

	const onDehydrateModules = async () => {
		for (const module of modules) {
			router.removeRoute(module.id);
		}

		registeredModules.value = [];
	};

	return { registeredModules, onHydrateModules, onDehydrateModules };
}
