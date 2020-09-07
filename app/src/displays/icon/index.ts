import { defineDisplay } from '@/displays/define';
import DisplayIcon from './icon.vue';

export default defineDisplay(({ i18n }) => ({
	id: 'icon',
	name: i18n.t('icon'),
	icon: 'thumb_up',
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
					label: i18n.t('displays.icon.use_filled_variant'),
				},
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
