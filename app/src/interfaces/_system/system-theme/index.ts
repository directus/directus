import InterfaceSystemTheme from './system-theme.vue';
import { defineInterface } from '@directus/extensions';

export default defineInterface({
	id: 'system-theme',
	name: '$t:theme',
	icon: 'palette',
	component: InterfaceSystemTheme,
	types: ['string'],
	options: [],
	system: true,
});
