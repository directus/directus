import { RouteRecordRaw } from 'vue-router';
import { router } from '@/router';
import { getModules } from './index';
import { useUserStore, usePermissionsStore } from '@/stores';
import api from '@/api';
import { getRootPath } from '@/utils/get-root-path';
import { ModuleConfig } from './types';
// @TODO3 tiny-async-pool relies on node.js global variables
import asyncPool from 'tiny-async-pool/lib/es7.js';

const { modulesRaw } = getModules();

let queuedModules: ModuleConfig[] = [];

const removeRoutes: (() => void)[] = [];

export async function loadModules() {
	const moduleModules = import.meta.globEager('./*/**/index.ts');

	const modules: ModuleConfig[] = Object.values(moduleModules).map((module) => module.default);

	try {
		const customResponse = await api.get('/extensions/modules/');
		const customModules: string[] = customResponse.data.data || [];

		await asyncPool(5, customModules, async (moduleName) => {
			try {
				const result = await import(/* @vite-ignore */ `${getRootPath()}extensions/modules/${moduleName}/index.js`);

				result.default.routes = result.default.routes.map((route: RouteRecordRaw) => {
					if (route.path) {
						if (route.path[0] === '/') route.path = route.path.substr(1);
						route.path = `/${result.default.id}/${route.path}`;
					}
					return route;
				});

				modules.push(result.default);
			} catch (err) {
				console.warn(`Couldn't load custom module "${moduleName}":`, err);
			}
		});
	} catch {
		console.warn(`Couldn't load custom modules`);
	}

	queuedModules = modules;
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
