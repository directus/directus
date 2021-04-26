import { RouteRecordRaw } from 'vue-router';
import { router } from '@/router';
import { getModules } from './index';
import { useUserStore, usePermissionsStore } from '@/stores';
import api from '@/api';
import { getRootPath } from '@/utils/get-root-path';
import asyncPool from 'tiny-async-pool';

const { modulesRaw } = getModules();

let queuedModules: any = [];

const removeRoutes: (() => void)[] = [];

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
				const result = await import(/* @vite-ignore */ getRootPath() + `extensions/modules/${moduleName}/index.js`);
				result.default.routes = result.default.routes.map((route: RouteRecordRaw) => {
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
		if (!userStore.currentUser) return false;

		if (mod.preRegisterCheck) {
			return mod.preRegisterCheck(userStore.currentUser, permissionsStore.permissions);
		}

		return true;
	});

	const moduleRoutes = registeredModules
		.map((module: any) => module.routes)
		.filter((r: any) => r)
		.flat() as RouteRecordRaw[];

	for (const route of moduleRoutes) {
		const removeRoute = router.addRoute(route);
		removeRoutes.push(removeRoute);
	}

	modulesRaw.value = registeredModules;
}

export function unregister() {
	for (const removeRoute of removeRoutes) {
		removeRoute();
	}

	modulesRaw.value = [];
}
