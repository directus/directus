import { router } from '@/router';
import { usePermissionsStore, useUserStore } from '@/stores';
import { getRootPath } from '@/utils/get-root-path';
import RouterPass from '@/utils/router-passthrough';
import { getModules } from './index';
import { ModuleConfig } from '@directus/shared/types';

const { modulesRaw } = getModules();

let queuedModules: ModuleConfig[] = [];

export async function loadModules(): Promise<void> {
	const moduleModules = import.meta.globEager('./*/index.ts');

	const modules: ModuleConfig[] = Object.values(moduleModules).map((module) => module.default);

	try {
		const customModules: { default: ModuleConfig[] } = import.meta.env.DEV
			? await import('@directus-extensions-module')
			: await import(/* @vite-ignore */ `${getRootPath()}extensions/modules/index.js`);

		modules.push(...customModules.default);
	} catch (err: any) {
		// eslint-disable-next-line no-console
		console.warn(`Couldn't load custom modules`);
		// eslint-disable-next-line no-console
		console.warn(err);
	}

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
