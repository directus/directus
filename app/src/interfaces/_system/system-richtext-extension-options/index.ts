import { defineInterface } from '@directus/extensions';
import InterfaceSystemRichtextExtensionOptions from './system-richtext-extension-options.vue';

export default defineInterface({
	id: 'system-richtext-extension-options',
	name: '$t:interfaces.input-rich-text-html.extension_options',
	icon: 'extension',
	component: InterfaceSystemRichtextExtensionOptions,
	types: ['json'],
	options: [],
	system: true,
	hideLabel: true,
});
