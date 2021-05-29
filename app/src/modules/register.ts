import api from '@/api';
import { router } from '@/router';
import { usePermissionsStore, useUserStore } from '@/stores';
import { getRootPath } from '@/utils/get-root-path';
import routerPassthrough from '@/utils/router-passthrough';
// @TODO3 tiny-async-pool relies on node.js global variables
import asyncPool from 'tiny-async-pool/lib/es7.js';
import { getModules } from './index';
import { ModuleConfig } from './types';

const { modulesRaw } = getModules();

let queuedModules: ModuleConfig[] = [];

export async function loadModules(): Promise<void> {
	const moduleModules = import.meta.globEager('./*/**/index.ts');

	const modules: ModuleConfig[] = Object.values(moduleModules).map((module) => module.default);

	try {
		const customResponse = await api.get('/extensions/modules/');
		const customModules: string[] = customResponse.data.data || [];

		await asyncPool(5, customModules, async (moduleName) => {
			try {
				const result = await import(/* @vite-ignore */ `${getRootPath()}extensions/modules/${moduleName}/index.js`);

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

export async function register(): Promise<void> {
	const userStore = useUserStore();
	const permissionsStore = usePermissionsStore();

	const registeredModules = queuedModules.filter((mod: any) => {
		if (!userStore.currentUser) return false;

		if (mod.preRegisterCheck) {
			return mod.preRegisterCheck(userStore.currentUser, permissionsStore.permissions);
		}

		return true;
	});

	for (const module of registeredModules) {
		router.addRoute({
			name: module.id,
			path: `/${module.id}`,
			component: routerPassthrough(),
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
