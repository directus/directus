import { defineInterface } from '@directus/extensions';
import InterfaceSystemInterfaceOptions from './system-interface-options.vue';

export default defineInterface({
	id: 'system-interface-options',
	name: '$t:interfaces.system-interface-options.interface-options',
	description: '$t:interfaces.system-interface-options.description',
	icon: 'box',
	component: InterfaceSystemInterfaceOptions,
	types: ['string'],
	options: [],
	system: true,
});
