import { defineInterface } from '@/interfaces/define';
import InterfaceSlug from './slug.vue';

export default defineInterface(({ i18n }) => ({
	id: 'slug',
	name: i18n.t('slug'),
	icon: 'link',
	component: InterfaceSlug,
	types: ['string'],
	options: [
		{
			field: 'placeholder',
			name: i18n.t('placeholder'),
			meta: {
				width: 'half',
				interface: 'text-input',
				options: {
					placeholder: i18n.t('text_shown_when_no_value'),
				},
			},
		},
		{
			field: 'iconLeft',
			name: i18n.t('icon_left'),
			type: 'string',
			meta: {
				width: 'half',
				interface: 'icon',
			},
		},
		{
			field: 'iconRight',
			name: i18n.t('icon_right'),
			type: 'string',
			meta: {
				width: 'half',
				interface: 'icon',
			},
		},
	],
}));
