import { defineInterface } from '@directus/shared/utils';
import InterfaceThemeColorPicker from './theme-color-picker.vue';

export default defineInterface({
	id: 'theme-color-picker',
	name: '$t:interfaces.system-theme.color_picker',
	icon: 'palette',
	component: InterfaceThemeColorPicker,
	types: ['string'],
	options: [],
	system: true,
});
