import { i18n } from '@/lang/';
import { Module, ModuleOptions, ModuleContext } from './types';

export function defineModule(options: ModuleOptions): Module {
	const context: ModuleContext = { i18n };

	const config = {
		id: options.id,
		...options.register(context),
	};

	config.routes = config.routes.map((route) => ({
		...route,
		path: `/:project/${config.id}${route.path}`,
	}));

	return config;
}
