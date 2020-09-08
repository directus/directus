import { defineDisplay } from '@/displays/define';
import DisplayIcon from './icon.vue';

export default defineDisplay(({ i18n }) => ({
	id: 'icon',
	name: i18n.t('icon'),
	icon: 'thumb_up',
	handler: DisplayIcon,
	options: [
		{
			field: 'outline',
			name: i18n.t('outline'),
			type: 'boolean',
			meta: {
				interface: 'toggle',
				width: 'half',
				options: {
					label: i18n.t('use_outline_variant'),
				},
			},
		},
	],
	types: ['string'],
}));
