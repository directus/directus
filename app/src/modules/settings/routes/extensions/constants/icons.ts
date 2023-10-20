import { EXTENSION_TYPES } from '@directus/extensions';

export const iconMap: Record<(typeof EXTENSION_TYPES)[number], string> = {
	interface: 'design_services',
	display: 'label',
	layout: 'dataset',
	module: 'web',
	panel: 'analytics',
	hook: 'webhook',
	endpoint: 'api',
	operation: 'flowsheet',
	bundle: 'hub',
};
