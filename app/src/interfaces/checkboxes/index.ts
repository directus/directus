import { defineInterface } from '@/interfaces/define';
import InterfaceCheckboxes from './checkboxes.vue';

export default defineInterface(({ i18n }) => ({
	id: 'checkboxes',
	name: i18n.t('interfaces.checkboxes.checkboxes'),
	icon: 'check_box',
	component: InterfaceCheckboxes,
	description: i18n.t('interfaces.checkboxes.description'),
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
									placeholder: i18n.t('interfaces.dropdown.choices_name_placeholder'),
								},
							},
						},
					],
				},
			},
		},
		{
			field: 'allowOther',
			name: i18n.t('interfaces.checkboxes.allow_other'),
			type: 'boolean',
			meta: {
				width: 'half',
				interface: 'toggle',
				options: {
					label: i18n.t('enable_custom_values'),
				},
			},
			schema: {
				default_value: false,
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
			schema: {
				default_value: '#2f80ed',
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
				default_value: 'check_box',
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
				default_value: 'check_box_outline_blank',
			},
		},
		{
			field: 'itemsShown',
			name: i18n.t('interfaces.checkboxes.items_shown'),
			type: 'integer',
			meta: {
				width: 'half',
				interface: 'numeric',
			},
			schema: {
				default_value: 8,
			},
		},
	],
	recommendedDisplays: ['labels'],
}));
