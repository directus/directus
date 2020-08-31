import { RouteConfig } from 'vue-router';
import { replaceRoutes } from '@/router';
import { getModules } from './index';
import { useUserStore, usePermissionsStore } from '@/stores';

const modules = getModules();

const context = require.context('.', true, /^.*index\.ts$/);

const loadedModules = context
	.keys()
	.map((key) => context(key))
	.map((mod) => mod.default)
	.filter((m) => m);

export function register() {
	const userStore = useUserStore();
	const permissionsStore = usePermissionsStore();

	const registeredModules = loadedModules.filter((mod) => {
		if (!userStore.state.currentUser) return false;

		if (mod.preRegisterCheck) {
			return mod.preRegisterCheck(userStore.state.currentUser, permissionsStore.state.permissions);
		}

		return true;
	});

	const moduleRoutes = registeredModules
		.map((module) => module.routes)
		.filter((r) => r)
		.flat() as RouteConfig[];

	replaceRoutes((routes) => insertBeforeProjectWildcard(routes, moduleRoutes));

	modules.value = registeredModules;

	function insertBeforeProjectWildcard(currentRoutes: RouteConfig[], routesToBeAdded: RouteConfig[]) {
		// Find the index of the /* route, so we can insert the module routes right above that
		const wildcardIndex = currentRoutes.findIndex((route) => route.path === '/*');
		return [...currentRoutes.slice(0, wildcardIndex), ...routesToBeAdded, ...currentRoutes.slice(wildcardIndex)];
	}
}

export function unregister() {
	replaceRoutes((routes) => routes);
	modules.value = [];
}
