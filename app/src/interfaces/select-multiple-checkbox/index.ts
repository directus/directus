import { defineInterface } from '@directus/extensions';
import InterfaceSelectMultipleCheckboxes from './select-multiple-checkbox.vue';
import PreviewSVG from './preview.svg?raw';

export default defineInterface({
	id: 'select-multiple-checkbox',
	name: '$t:interfaces.select-multiple-checkbox.checkboxes',
	icon: 'check_box',
	component: InterfaceSelectMultipleCheckboxes,
	description: '$t:interfaces.select-multiple-checkbox.description',
	types: ['json', 'csv'],
	group: 'selection',
	preview: PreviewSVG,
	options: [
		{
			field: 'choices',
			type: 'json',
			name: '$t:choices',
			meta: {
				width: 'full',
				interface: 'list',
				options: {
					template: '{{ text }}',
					fields: [
						{
							field: 'text',
							type: 'string',
							name: '$t:text',
							meta: {
								width: 'half',
								interface: 'system-input-translated-string',
								required: true,
								options: {
									placeholder: '$t:interfaces.select-dropdown.choices_name_placeholder',
								},
							},
						},
						{
							field: 'value',
							type: 'string',
							name: '$t:value',
							meta: {
								width: 'half',
								interface: 'input',
								required: true,
								options: {
									font: 'monospace',
									placeholder: '$t:interfaces.select-dropdown.choices_name_placeholder',
								},
							},
						},
					],
				},
			},
		},
		{
			field: 'allowOther',
			name: '$t:interfaces.select-multiple-checkbox.allow_other',
			type: 'boolean',
			meta: {
				width: 'half',
				interface: 'boolean',
				options: {
					label: '$t:enable_custom_values',
				},
			},
			schema: {
				default_value: false,
			},
		},
		{
			field: 'color',
			name: '$t:color',
			type: 'string',
			meta: {
				width: 'half',
				interface: 'select-color',
			},
		},
		{
			field: 'iconOn',
			name: '$t:icon_on',
			type: 'string',
			meta: {
				width: 'half',
				interface: 'select-icon',
			},
			schema: {
				default_value: 'check_box',
			},
		},
		{
			field: 'iconOff',
			name: '$t:icon_off',
			type: 'string',
			meta: {
				width: 'half',
				interface: 'select-icon',
			},
			schema: {
				default_value: 'check_box_outline_blank',
			},
		},
		{
			field: 'itemsShown',
			name: '$t:interfaces.select-multiple-checkbox.items_shown',
			type: 'integer',
			meta: {
				width: 'half',
				interface: 'input',
			},
			schema: {
				default_value: 8,
			},
		},
	],
	recommendedDisplays: ['labels'],
});
