import InterfaceTextarea from './textarea.vue';
import { defineInterface } from '@/interfaces/define';

export default defineInterface(({ i18n }) => ({
	id: 'textarea',
	name: i18n.t('textarea'),
	icon: 'text_fields',
	component: InterfaceTextarea,
	types: ['text'],
	options: [
		{
			field: 'placeholder',
			name: i18n.t('placeholder'),
			width: 'half',
			interface: 'text-input',
		},
		{
			field: 'trim',
			name: i18n.t('trim'),
			width: 'half',
			interface: 'switch',
		},
		{
			field: 'font',
			name: i18n.t('font'),
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
	],
}));
