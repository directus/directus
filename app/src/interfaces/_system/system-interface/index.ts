import { defineInterface } from '@directus/extensions';
import InterfaceSystemInterface from './system-interface.vue';

export default defineInterface({
	id: 'system-interface',
	name: '$t:interfaces.system-interface.interface',
	description: '$t:interfaces.system-interface.description',
	icon: 'box',
	component: InterfaceSystemInterface,
	types: ['string'],
	system: true,
	options: [],
});
