import { DisplayDefineParam, DisplayConfig } from './types';

export function defineDisplay(config: DisplayDefineParam): DisplayConfig {
	let options: DisplayConfig;

	if (typeof config === 'function') {
		options = config();
	} else {
		options = config;
	}

	return options;
}
