import { i18n } from '@/lang/';
import { Layout, LayoutOptions, LayoutContext } from './types';

export function defineLayout(options: LayoutOptions): Layout {
	const context: LayoutContext = { i18n };

	const config = {
		id: options.id,
		...options.register(context)
	};

	return config;
}
