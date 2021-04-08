import { ModuleDefineParam, ModuleConfig } from './types';

export function defineModule(config: ModuleDefineParam): ModuleConfig {
	let options: ModuleConfig;

	if (typeof config === 'function') {
		options = config();
	} else {
		options = config;
	}

	if (options.routes !== undefined) {
		options.routes = options.routes.map((route) => {
			if (route.path) {
				route.path = `/${options.id}${route.path}`;
			}

			if (route.redirect) {
				route.redirect = `/${options.id}${route.redirect}`;
			}

			return route;
		});
	}

	return options;
}
