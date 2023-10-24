import { defineInterface } from '@directus/extensions';
import InterfaceSystemDisplay from './system-display.vue';

export default defineInterface({
	id: 'system-display',
	name: '$t:interfaces.system-display.display',
	description: '$t:interfaces.system-display.description',
	icon: 'box',
	component: InterfaceSystemDisplay,
	types: ['string'],
	system: true,
	options: [],
});
