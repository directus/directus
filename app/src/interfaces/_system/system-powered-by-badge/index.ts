import { defineInterface } from '@directus/extensions';
import InterfaceSystemPoweredByBadge from './system-powered-by-badge.vue';

export default defineInterface({
	id: 'system-powered-by-badge',
	name: '$t:interfaces.powered-by-badge.name',
	icon: 'badge',
	component: InterfaceSystemPoweredByBadge,
	types: ['string'],
	options: [],
	system: true,
});
