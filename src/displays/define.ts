import { i18n } from '@/lang';
import { DisplayDefineParam, DisplayContext, DisplayConfig } from './types';

export function defineDisplay(config: DisplayDefineParam): DisplayConfig {
	let options: DisplayConfig;

	if (typeof config === 'function') {
		const context: DisplayContext = { i18n };
		options = config(context);
	} else {
		options = config;
	}

	return options;
}
