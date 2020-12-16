import { defineInterface } from '@/interfaces/define';
import InterfaceRadioButtons from './radio-buttons.vue';

export default defineInterface(({ i18n }) => ({
	id: 'radio-buttons',
	name: i18n.t('interfaces.radio-buttons.radio-buttons'),
	description: i18n.t('interfaces.radio-buttons.description'),
	icon: 'radio_button_checked',
	component: InterfaceRadioButtons,
	types: ['string'],
	recommendedDisplays: ['badge'],
	options: [
		{
			field: 'choices',
			type: 'json',
			name: i18n.t('choices'),
			meta: {
				width: 'full',
				interface: 'repeater',
				options: {
					template: '{{ text }}',
					fields: [
						{
							field: 'text',
							type: 'string',
							name: i18n.t('text'),
							meta: {
								width: 'half',
								interface: 'text-input',
							},
						},
						{
							field: 'value',
							type: 'string',
							name: i18n.t('value'),
							meta: {
								width: 'half',
								interface: 'text-input',
								options: {
									font: 'monospace',
								},
							},
						},
					],
				},
			},
		},
		{
			field: 'iconOn',
			name: i18n.t('icon_on'),
			type: 'string',
			meta: {
				width: 'half',
				interface: 'icon',
			},
			schema: {
				default_value: 'radio_button_checked',
			},
		},
		{
			field: 'iconOff',
			name: i18n.t('icon_off'),
			type: 'string',
			meta: {
				width: 'half',
				interface: 'icon',
			},
			schema: {
				default_value: 'radio_button_unchecked',
			},
		},
		{
			field: 'color',
			name: i18n.t('color'),
			type: 'string',
			meta: {
				width: 'half',
				interface: 'color',
			},
		},
		{
			field: 'allowOther',
			name: i18n.t('interfaces.dropdown.allow_other'),
			type: 'string',
			meta: {
				width: 'half',
				interface: 'toggle',
				options: {
					label: i18n.t('interfaces.dropdown.allow_other_label'),
				},
			},
			schema: {
				default_value: false,
			},
		},
	],
}));
