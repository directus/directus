import { defineInterface } from '@directus/utils';
import PreviewSVG from './preview.svg?raw';
import InterfaceSelectDropdown from './select-dropdown.vue';

export default defineInterface({
	id: 'select-dropdown',
	name: '$t:dropdown',
	description: '$t:interfaces.select-dropdown.description',
	icon: 'arrow_drop_down_circle',
	component: InterfaceSelectDropdown,
	types: ['string', 'integer', 'float', 'bigInteger'],
	group: 'selection',
	preview: PreviewSVG,
	options: ({ field }) => [
		{
			field: 'choices',
			type: 'json',
			name: '$t:choices',
			meta: {
				width: 'full',
				interface: 'list',
				options: {
					placeholder: '$t:interfaces.select-dropdown.choices_placeholder',
					template: '{{ text }}',
					fields: [
						{
							field: 'text',
							type: 'string',
							name: '$t:text',
							meta: {
								interface: 'system-input-translated-string',
								required: true,
								width: 'half',
								options: {
									placeholder: '$t:interfaces.select-dropdown.choices_name_placeholder',
								},
							},
						},
						{
							field: 'value',
							type: field.type,
							name: '$t:value',
							meta: {
								interface: 'input',
								options: {
									font: 'monospace',
									placeholder: '$t:interfaces.select-dropdown.choices_value_placeholder',
								},
								required: true,
								width: 'half',
							},
						},
					],
				},
			},
		},
		{
			field: 'allowOther',
			name: '$t:interfaces.select-dropdown.allow_other',
			type: 'boolean',
			meta: {
				width: 'half',
				interface: 'boolean',
				options: {
					label: '$t:interfaces.select-dropdown.allow_other_label',
				},
			},
			schema: {
				default_value: false,
			},
		},
		{
			field: 'allowNone',
			name: '$t:interfaces.select-dropdown.allow_none',
			type: 'boolean',
			meta: {
				width: 'half',
				interface: 'boolean',
				options: {
					label: '$t:interfaces.select-dropdown.allow_none_label',
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
				interface: 'select-icon',
			},
		},
		{
			field: 'placeholder',
			name: '$t:placeholder',
			type: 'string',
			meta: {
				width: 'half',
				interface: 'system-input-translated-string',
				options: {
					placeholder: '$t:enter_a_placeholder',
				},
			},
		},
	],
	recommendedDisplays: ['labels'],
});
