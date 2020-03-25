import { i18n } from '@/lang';
import { InterfaceDefineParam, InterfaceContext, InterfaceConfig } from './types';

export function defineInterface(config: InterfaceDefineParam): InterfaceConfig {
	let options: InterfaceConfig;

	if (typeof config === 'function') {
		const context: InterfaceContext = { i18n };
		options = config(context);
	} else {
		options = config;
	}

	return options;
}
