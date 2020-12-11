import { defineInterface } from '@/interfaces/define';
import InterfaceDropdownMultiselect from './dropdown-multiselect.vue';

export default defineInterface(({ i18n }) => ({
	id: 'dropdown-multiselect',
	name: i18n.t('interfaces.dropdown-multiselect.dropdown-multiselect'),
	description: i18n.t('interfaces.dropdown-multiselect.description'),
	icon: 'arrow_drop_down_circle',
	component: InterfaceDropdownMultiselect,
	types: ['json', 'csv'],
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
								width: 'half',
								interface: 'text-input',
								options: {
									placeholder: i18n.t('interfaces.dropdown.choices_name_placeholder'),
								},
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
									placeholder: i18n.t('interfaces.dropdown.choices_value_placeholder'),
								},
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
		{
			field: 'icon',
			name: i18n.t('icon'),
			type: 'string',
			meta: {
				width: 'half',
				interface: 'icon',
			},
		},
	],
	recommendedDisplays: ['labels'],
}));
