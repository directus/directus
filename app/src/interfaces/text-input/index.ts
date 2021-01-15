import InterfaceTextInput from './text-input.vue';
import { defineInterface } from '@/interfaces/define';

export default defineInterface(({ i18n }) => ({
	id: 'text-input',
	name: i18n.t('interfaces.text-input.text-input'),
	description: i18n.t('interfaces.text-input.description'),
	icon: 'text_fields',
	component: InterfaceTextInput,
	types: ['string', 'uuid'],
	options: [
		{
			field: 'placeholder',
			name: i18n.t('placeholder'),
			meta: {
				width: 'half',
				interface: 'text-input',
				options: {
					placeholder: i18n.t('enter_a_placeholder'),
				},
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
			field: 'masked',
			name: i18n.t('interfaces.text-input.mask'),
			type: 'boolean',
			meta: {
				width: 'half',
				interface: 'toggle',
				options: {
					label: i18n.t('interfaces.text-input.mask_label'),
				},
			},
			schema: {
				default_value: false,
			},
		},
		{
			field: 'nullable',
			name: i18n.t('interfaces.text-input.nullable'),
			type: 'boolean',
			meta: {
				width: 'half',
				interface: 'toggle',
				options: {
					label: i18n.t('interfaces.text-input.nullable_label'),
				},
			},
			schema: {
				default_value: true,
			},
		},
	],
}));
