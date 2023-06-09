import { router } from '@/router';
import { usePermissionsStore } from '@/stores/permissions';
import { useUserStore } from '@/stores/user';
import { ModuleConfig } from '@directus/types';
import { sortBy } from 'lodash';
import { ShallowRef, shallowRef } from 'vue';

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
			for (const route of module.routes) {
				router.addRoute(route);
			}
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
