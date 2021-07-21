import { ModuleConfig, ModuleDefineParam } from './types';

export function defineModule(config: ModuleDefineParam): ModuleConfig {
	let options: ModuleConfig;

	if (typeof config === 'function') {
		options = config();
	} else {
		options = config;
	}

	return options;
}
