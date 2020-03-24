import { i18n } from '@/lang';
import { Interface, InterfaceOptions, InterfaceContext } from './types';

export function defineInterface(options: InterfaceOptions): Interface {
	const context: InterfaceContext = { i18n };

	const config = {
		id: options.id,
		...options.register(context),
	};

	return config;
}
