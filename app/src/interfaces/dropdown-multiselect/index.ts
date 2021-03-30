import { defineInterface } from '@/interfaces/define';
import InterfaceDropdownMultiselect from './dropdown-multiselect.vue';

export default defineInterface({
	id: 'dropdown-multiselect',
	name: '$t:interfaces.dropdown-multiselect.dropdown-multiselect',
	description: '$t:interfaces.dropdown-multiselect.description',
	icon: 'arrow_drop_down_circle',
	component: InterfaceDropdownMultiselect,
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
					placeholder: '$t:interfaces.dropdown.choices_placeholder',
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
									placeholder: '$t:interfaces.dropdown.choices_value_placeholder',
								},
							},
						},
					],
				},
			},
		},
		{
			field: 'allowOther',
			name: '$t:interfaces.dropdown.allow_other',
			type: 'boolean',
			meta: {
				width: 'half',
				interface: 'toggle',
				options: {
					label: '$t:interfaces.dropdown.allow_other_label',
				},
			},
			schema: {
				default_value: false,
			},
		},
		{
			field: 'allowNone',
			name: '$t:interfaces.dropdown.allow_none',
			type: 'boolean',
			meta: {
				width: 'half',
				interface: 'toggle',
				options: {
					label: '$t:interfaces.dropdown.allow_none_label',
				},
			},
			schema: {
				default_value: false,
			},
		},
		{
			field: 'placeholder',
			name: '$t:placeholder',
			type: 'string',
			meta: {
				width: 'half',
				interface: 'text-input',
				options: {
					placeholder: '$t:enter_a_placeholder',
				},
			},
		},
		{
			field: 'icon',
			name: '$t:icon',
			type: 'string',
			meta: {
				width: 'half',
				interface: 'icon',
			},
		},
	],
	recommendedDisplays: ['labels'],
});
