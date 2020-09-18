import { defineDisplay } from '@/displays/define';
import DisplayColor from './color.vue';

export default defineDisplay(({ i18n }) => ({
	id: 'color',
	name: i18n.t('displays.color.color'),
	description: i18n.t('displays.color.description'),
	types: ['string'],
	icon: 'flag',
	handler: DisplayColor,
	options: [
		{
			field: 'defaultColor',
			name: i18n.t('displays.color.default_color'),
			type: 'string',
			meta: {
				interface: 'color',
				width: 'half',
			},
			schema: {
				default_value: '#B0BEC5',
			},
		},
	],
}));
