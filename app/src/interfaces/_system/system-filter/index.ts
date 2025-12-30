import InterfaceSystemFilter from './system-filter.vue';
import { defineInterface } from '@directus/extensions';

export default defineInterface({
	id: 'system-filter',
	name: '$t:interfaces.filter.name',
	icon: 'search',
	component: InterfaceSystemFilter,
	types: ['json'],
	options: [],
	system: true,
});
