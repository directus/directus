import { defineInterface } from '@directus/extensions';
import InterfaceSystemLinkProtocols from './system-link-protocols.vue';

export default defineInterface({
	id: 'system-link-protocols',
	name: '$t:interfaces.input-rich-text-html.link_protocols',
	icon: 'link',
	component: InterfaceSystemLinkProtocols,
	types: ['csv'],
	options: [],
	system: true,
});
