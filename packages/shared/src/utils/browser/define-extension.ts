import { InterfaceConfig, InterfaceDefineParam, DisplayConfig, DisplayDefineParam } from '../../types';

export function defineInterface(config: InterfaceDefineParam): InterfaceConfig {
	let options: InterfaceConfig;

	if (typeof config === 'function') {
		options = config();
	} else {
		options = config;
	}

	return options;
}

export function defineDisplay(config: DisplayDefineParam): DisplayConfig {
	let options: DisplayConfig;

	if (typeof config === 'function') {
		options = config();
	} else {
		options = config;
	}

	return options;
}
