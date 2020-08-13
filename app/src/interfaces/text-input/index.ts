import InterfaceTextInput from './text-input.vue';
import { defineInterface } from '@/interfaces/define';

export default defineInterface(({ i18n }) => ({
	id: 'text-input',
	name: i18n.t('text_input'),
	icon: 'text_fields',
	component: InterfaceTextInput,
	types: ['string'],
	options: [
		{
			field: 'placeholder',
			name: i18n.t('placeholder'),
			meta: {
				width: 'half',
				interface: 'text-input',
			},
		},
		{
			field: 'font',
			name: i18n.t('font'),
			meta: {
				width: 'half',
				interface: 'dropdown',
				default: 'sans-serif',
				options: {
					choices: [
						{ text: i18n.t('sans_serif'), value: 'sans-serif' },
						{ text: i18n.t('monospace'), value: 'monospace' },
						{ text: i18n.t('serif'), value: 'serif' },
					],
				},
			},
		},
		{
			field: 'iconLeft',
			name: i18n.t('icon_left'),
			meta: {
				width: 'half',
				interface: 'icon',
			},
		},
		{
			field: 'iconRight',
			name: i18n.t('icon_right'),
			meta: {
				width: 'half',
				interface: 'icon',
			},
		},
	],
}));
