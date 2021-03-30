import { InterfaceDefineParam, InterfaceContext, InterfaceConfig } from './types';

export function defineInterface(config: InterfaceDefineParam): InterfaceConfig {
	let options: InterfaceConfig;

	if (typeof config === 'function') {
		const context: InterfaceContext = {};
		options = config(context);
	} else {
		options = config;
	}

	return options;
}
