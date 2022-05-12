import { defineInterface } from '@directus/shared/utils';
import InterfaceThemeGeneratedColor from './theme-generated-color.vue';

export default defineInterface({
	id: 'theme-generated-color',
	name: '$t:interfaces.system-theme.color_generated',
	icon: 'palette',
	component: InterfaceThemeGeneratedColor,
	types: ['string'],
	options: [],
	system: true,
});
