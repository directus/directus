import InterfaceSystemDisplayOptions from './system-display-options.vue';
import { defineInterface } from '@directus/extensions';

export default defineInterface({
	id: 'system-display-options',
	name: '$t:interfaces.system-display-options.display-options',
	description: '$t:interfaces.system-display-options.description',
	icon: 'box',
	component: InterfaceSystemDisplayOptions,
	types: ['string'],
	options: [],
	system: true,
});
