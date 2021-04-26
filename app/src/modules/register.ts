import { RouteConfig } from 'vue-router';
import { replaceRoutes } from '@/router';
import { getModules } from './index';
import { useUserStore, usePermissionsStore } from '@/stores';
import api from '@/api';
import { getRootPath } from '@/utils/get-root-path';
import asyncPool from 'tiny-async-pool';

const { modulesRaw } = getModules();

let queuedModules: any = [];

export async function loadModules() {
	const context = require.context('.', true, /^.*index\.ts$/);

	queuedModules = context
		.keys()
		.map((key) => context(key))
		.map((mod) => mod.default)
		.filter((m) => m);

	try {
		const customResponse = await api.get('/extensions/modules/');
		const modules: string[] = customResponse.data.data || [];

		await asyncPool(5, modules, async (moduleName) => {
			try {
				const result = await import(
					/* webpackIgnore: true */ getRootPath() + `extensions/modules/${moduleName}/index.js`
				);
				result.default.routes = result.default.routes.map((route: RouteConfig) => {
					if (route.path) {
						if (route.path[0] === '/') route.path = route.path.substr(1);
						route.path = `/${result.default.id}/${route.path}`;
					}
					return route;
				});
				queuedModules.push(result.default);
			} catch (err) {
				console.warn(`Couldn't load custom module "${moduleName}":`, err);
			}
		});
	} catch {
		console.warn(`Couldn't load custom modules`);
	}
}

export async function register() {
	const userStore = useUserStore();
	const permissionsStore = usePermissionsStore();

	const registeredModules = queuedModules.filter((mod: any) => {
		if (!userStore.state.currentUser) return false;

		if (mod.preRegisterCheck) {
			return mod.preRegisterCheck(userStore.state.currentUser, permissionsStore.state.permissions);
		}

		return true;
	});

	const moduleRoutes = registeredModules
		.map((module: any) => module.routes)
		.filter((r: any) => r)
		.flat() as RouteConfig[];

	replaceRoutes((routes) => insertBeforeProjectWildcard(routes, moduleRoutes));

	modulesRaw.value = registeredModules;

	function insertBeforeProjectWildcard(currentRoutes: RouteConfig[], routesToBeAdded: RouteConfig[]) {
		// Find the index of the /* route, so we can insert the module routes right above that
		const wildcardIndex = currentRoutes.findIndex((route) => route.path === '/*');
		return [...currentRoutes.slice(0, wildcardIndex), ...routesToBeAdded, ...currentRoutes.slice(wildcardIndex)];
	}
}

export function unregister() {
	replaceRoutes((routes) => routes);
	modulesRaw.value = [];
}
