import { defineInterface } from '@/interfaces/define';
import InterfaceDropdown from './dropdown.vue';

export default defineInterface({
	id: 'dropdown',
	name: '$t:dropdown',
	description: '$t:interfaces.dropdown.description',
	icon: 'arrow_drop_down_circle',
	component: InterfaceDropdown,
	types: ['string'],
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
								interface: 'text-input',
								width: 'half',
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
								interface: 'text-input',
								options: {
									font: 'monospace',
									placeholder: '$t:interfaces.dropdown.choices_value_placeholder',
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
			field: 'icon',
			name: '$t:icon',
			type: 'string',
			meta: {
				width: 'half',
				interface: 'icon',
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
	],
	recommendedDisplays: ['labels'],
});
