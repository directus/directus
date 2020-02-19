import { createStore } from 'pinia';
import { Module, ModuleConfig } from '@/types/modules';
import systemModules from '@/modules/';
import router from '@/router';
import { i18n } from '@/lang';

export const useModulesStore = createStore({
	id: 'modules',
	state: () => ({
		modules: [] as Module[]
	}),
	actions: {
		/**
		 * Registers all global modules, including the system ones
		 */
		registerGlobalModules() {
			systemModules.forEach(this.registerModule);
		},
		/**
		 * Register a single module. Adds the routes to the router, resolves the name, and adds it to
		 * the modules store state.
		 * @param config Config object for module
		 */
		registerModule(config: ModuleConfig) {
			const routes = config.routes.map(route => ({
				...route,
				path: `/:project/${config.id}${route.path}`
			}));

			router.addRoutes(routes);

			const name = typeof config.name === 'function' ? config.name(i18n) : config.name;

			this.state.modules = [
				...this.state.modules,
				{
					id: config.id,
					icon: config.icon,
					name: name
				}
			];
		}
	}
});
