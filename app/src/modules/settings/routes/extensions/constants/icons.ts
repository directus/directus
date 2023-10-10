import { EXTENSION_TYPES } from '@directus/extensions';

export const iconMap: Record<(typeof EXTENSION_TYPES)[number], string> = {
	interface: 'design_services',
	display: 'label',
	layout: 'dataset, layers',
	module: 'web',
	panel: 'analytics',
	hook: 'webhook, anchor',
	endpoint: 'api, conversion_path',
	operation: 'flowsheet',
	bundle: 'hub',
};
