import { i18n } from '@/lang/';
import { ModuleDefineParam, ModuleContext, ModuleConfig } from './types';

export function defineModule(config: ModuleDefineParam | ((context: ModuleContext) => ModuleConfig)): ModuleConfig {
	let options: ModuleConfig;

	if (typeof config === 'function') {
		const context: ModuleContext = { i18n };
		options = config(context);
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
