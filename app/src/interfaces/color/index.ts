import { defineInterface } from '@/interfaces/define';
import InterfaceColor from './color.vue';

export default defineInterface(({ i18n }) => ({
	id: 'color',
	name: i18n.t('color'),
	icon: 'palette',
	component: InterfaceColor,
	types: ['string'],
	options: [
		{
			field: 'presets',
			name: 'Preset Colors',
			width: 'full',
			interface: 'repeater<color>',
		},
	],
}));
