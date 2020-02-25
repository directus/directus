import CollectionsModule from './collections/';
import FilesModule from './files/';
import SettingsModule from './settings/';
import UsersModule from './users/';
import { RouteConfig } from 'vue-router';
import { ModuleConfig, Module } from '@/types/extensions';
import { replaceRoutes } from '@/router';
import useExtensionsStore from '@/stores/extensions';
import { i18n } from '@/lang';

const lib = {
	registerGlobalModules,
	registerModules,
	insertBeforeProjectWildcard
};

export default lib;

export function insertBeforeProjectWildcard(routes: RouteConfig[], moduleRoutes: RouteConfig[]) {
	// Find the index of the /:project/* route, so we can insert the module routes right above that
	const wildcardIndex = routes.findIndex(route => route.path === '/:project/*');
	return [...routes.slice(0, wildcardIndex), ...moduleRoutes, ...routes.slice(wildcardIndex)];
}

export function registerModules(modules: ModuleConfig[]) {
	const extensionsStore = useExtensionsStore();

	/** @todo
	 * This is where we will download the module definitions for custom modules
	 */

	const moduleRoutes: RouteConfig[] = modules
		.map(config => {
			// Prefix all module paths with /:project/:module
			return config.routes.map(route => ({
				...route,
				path: `/:project/${config.id}${route.path}`
			}));
		})
		.flat();

	replaceRoutes(routes => lib.insertBeforeProjectWildcard(routes, moduleRoutes));

	const modulesForStore: Module[] = modules.map(config => {
		const name = typeof config.name === 'function' ? config.name(i18n) : config.name;

		return {
			id: config.id,
			name: name,
			icon: config.icon
		};
	});

	extensionsStore.state.modules = modulesForStore;
}

export function registerGlobalModules() {
	const globalModules: ModuleConfig[] = [
		CollectionsModule,
		FilesModule,
		SettingsModule,
		UsersModule
	];

	lib.registerModules(globalModules);
}
