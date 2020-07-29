import { i18n } from '@/lang';
import { LayoutDefineParam, LayoutContext, LayoutConfig } from './types';

export function defineLayout(config: LayoutDefineParam): LayoutConfig {
	let options: LayoutConfig;

	if (typeof config === 'function') {
		const context: LayoutContext = { i18n };
		options = config(context);
	} else {
		options = config;
	}

	return options;
}
