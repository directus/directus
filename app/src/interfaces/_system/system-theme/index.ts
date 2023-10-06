import { defineInterface } from '@directus/extensions';
import InterfaceSystemTheme from './system-theme.vue';

export default defineInterface({
	id: 'system-theme',
	name: '$t:theme',
	icon: 'palette',
	component: InterfaceSystemTheme,
	types: ['string'],
	options: [],
	system: true,
});
