import { i18n } from '@/lang/';
import { ModuleDefineParam, ModuleContext, ModuleConfig } from './types';

export function defineModule(config: ModuleDefineParam): ModuleConfig {
	let options: ModuleConfig;

	if (typeof config === 'function') {
		const context: ModuleContext = { i18n };
		options = config(context);
	} else {
		options = config;
	}

	options.routes = options.routes.map((route) => ({
		...route,
		path: `/:project/${options.id}${route.path}`,
	}));

	return options;
}
