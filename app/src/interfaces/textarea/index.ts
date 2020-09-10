import InterfaceTextarea from './textarea.vue';
import { defineInterface } from '@/interfaces/define';

export default defineInterface(({ i18n }) => ({
	id: 'textarea',
	name: i18n.t('interfaces.textarea.textarea'),
	description: i18n.t('interfaces.textarea.description'),
	icon: 'text_fields',
	component: InterfaceTextarea,
	types: ['text'],
	options: [
		{
			field: 'placeholder',
			name: i18n.t('placeholder'),
			type: 'string',
			meta: {
				width: 'full',
				interface: 'text-input',
				options: {
					placeholder: i18n.t('enter_a_placeholder'),
				},
			},
		},
		{
			field: 'trim',
			name: i18n.t('interfaces.text-input.trim'),
			type: 'boolean',
			meta: {
				width: 'half',
				interface: 'toggle',
				options: {
					label: i18n.t('interfaces.text-input.trim_label'),
				},
			},
			schema: {
				default_value: false,
			},
		},
		{
			field: 'font',
			name: i18n.t('font'),
			type: 'string',
			meta: {
				width: 'half',
				interface: 'dropdown',
				options: {
					choices: [
						{ text: i18n.t('sans_serif'), value: 'sans-serif' },
						{ text: i18n.t('monospace'), value: 'monospace' },
						{ text: i18n.t('serif'), value: 'serif' },
					],
				},
			},
			schema: {
				default_value: 'sans-serif',
			},
		},
	],
}));
