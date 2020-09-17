import { defineDisplay } from '@/displays/define';
import DisplayIcon from './icon.vue';

export default defineDisplay(({ i18n }) => ({
	id: 'icon',
	name: i18n.t('displays.icon.icon'),
	description: i18n.t('displays.icon.description'),
	icon: 'insert_emoticon',
	handler: DisplayIcon,
	options: [
		{
			field: 'filled',
			name: i18n.t('displays.icon.filled'),
			type: 'boolean',
			meta: {
				interface: 'toggle',
				width: 'half',
				options: {
					label: i18n.t('displays.icon.filled_label'),
				},
			},
			schema: {
				default_value: false,
			},
		},
		{
			field: 'color',
			name: i18n.t('color'),
			type: 'string',
			meta: {
				interface: 'color',
				width: 'half',
			},
		},
	],
	types: ['string'],
}));
