import { defineInterface } from '@/interfaces/define';
import InterfaceDropdown from './dropdown.vue';

export default defineInterface(({ i18n }) => ({
	id: 'dropdown',
	name: i18n.t('dropdown'),
	description: i18n.t('interfaces.dropdown.description'),
	icon: 'arrow_drop_down_circle',
	component: InterfaceDropdown,
	types: ['string', 'integer', 'decimal', 'float', 'bigInteger', 'dateTime', 'date', 'time', 'timestamp'],
	options: [
		{
			field: 'choices',
			type: 'json',
			name: i18n.t('choices'),
			meta: {
				width: 'full',
				interface: 'repeater',
				options: {
					placeholder: i18n.t('interfaces.dropdown.choices_placeholder'),
					template: '{{ text }}',
					fields: [
						{
							field: 'text',
							type: 'string',
							name: i18n.t('text'),
							meta: {
								interface: 'text-input',
								width: 'half',
								options: {
									placeholder: i18n.t('interfaces.dropdown.choices_name_placeholder'),
								},
							},
						},
						{
							field: 'value',
							type: 'string', // this is default, can be different in config based on the datatype
							name: i18n.t('value'),
							meta: {
								interface: 'text-input',
								options: {
									font: 'monospace',
									placeholder: i18n.t('interfaces.dropdown.choices_value_placeholder'),
								},
								width: 'half',
							},
						},
					],
				},
			},
		},
		{
			field: 'allowOther',
			name: i18n.t('interfaces.dropdown.allow_other'),
			type: 'boolean',
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
		{
			field: 'allowNone',
			name: i18n.t('interfaces.dropdown.allow_none'),
			type: 'boolean',
			meta: {
				width: 'half',
				interface: 'toggle',
				options: {
					label: i18n.t('interfaces.dropdown.allow_none_label'),
				},
			},
			schema: {
				default_value: false,
			},
		},
		{
			field: 'icon',
			name: i18n.t('icon'),
			type: 'string',
			meta: {
				width: 'half',
				interface: 'icon',
			},
		},
		{
			field: 'placeholder',
			name: i18n.t('placeholder'),
			type: 'string',
			meta: {
				width: 'half',
				interface: 'text-input',
				options: {
					placeholder: i18n.t('enter_a_placeholder'),
				},
			},
		},
	],
	recommendedDisplays: ['labels'],
}));
