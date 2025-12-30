import InterfaceSystemThemeOverrides from './system-theme-overrides.vue';
import { defineInterface } from '@directus/extensions';

export default defineInterface({
	id: 'system-theme-overrides',
	name: '$t:theme-overrides',
	icon: 'palette',
	component: InterfaceSystemThemeOverrides,
	types: ['json'],
	options: [],
	system: true,
});
