import { defineInterface } from '@/interfaces/define';
import InterfaceCheckboxes from './checkboxes.vue';

export default defineInterface({
	id: 'checkboxes',
	name: '$t:interfaces.checkboxes.checkboxes',
	icon: 'check_box',
	component: InterfaceCheckboxes,
	description: '$t:interfaces.checkboxes.description',
	types: ['json', 'csv'],
	options: [
		{
			field: 'choices',
			type: 'json',
			name: '$t:choices',
			meta: {
				width: 'full',
				interface: 'repeater',
				options: {
					template: '{{ text }}',
					fields: [
						{
							field: 'text',
							type: 'string',
							name: '$t:text',
							meta: {
								width: 'half',
								interface: 'text-input',
								options: {
									placeholder: '$t:interfaces.dropdown.choices_name_placeholder',
								},
							},
						},
						{
							field: 'value',
							type: 'string',
							name: '$t:value',
							meta: {
								width: 'half',
								interface: 'text-input',
								options: {
									font: 'monospace',
									placeholder: '$t:interfaces.dropdown.choices_name_placeholder',
								},
							},
						},
					],
				},
			},
		},
		{
			field: 'allowOther',
			name: '$t:interfaces.checkboxes.allow_other',
			type: 'boolean',
			meta: {
				width: 'half',
				interface: 'toggle',
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
				interface: 'color',
			},
			schema: {
				default_value: '#00C897',
			},
		},
		{
			field: 'iconOn',
			name: '$t:icon_on',
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
			name: '$t:icon_off',
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
			name: '$t:interfaces.checkboxes.items_shown',
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
});
