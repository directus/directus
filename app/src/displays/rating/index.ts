import { defineDisplay } from '@/displays/define';
import DisplayRating from './rating.vue';

export default defineDisplay(({ i18n }) => ({
	id: 'rating',
	name: i18n.t('displays.rating.rating'),
	description: i18n.t('displays.rating.description'),
	icon: 'star',
	handler: DisplayRating,
	options: [
		{
			field: 'simple',
			name: i18n.t('displays.rating.simple'),
			type: 'boolean',
			meta: {
				interface: 'toggle',
				width: 'half',
				options: {
					label: i18n.t('displays.rating.simple_label'),
				},
			},
			schema: {
				default_value: false,
			},
		},
	],
	types: ['integer', 'decimal', 'float'],
}));
