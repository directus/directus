import { defineInterface } from '@directus/extensions';
import PreviewSVG from './preview.svg?raw';
import InterfaceSelectMultipleDropdown from './select-multiple-dropdown.vue';

export default defineInterface({
	id: 'select-multiple-dropdown',
	name: '$t:interfaces.select-multiple-dropdown.select-multiple-dropdown',
	description: '$t:interfaces.select-multiple-dropdown.description',
	icon: 'arrow_drop_down_circle',
	component: InterfaceSelectMultipleDropdown,
	types: ['json', 'csv'],
	group: 'selection',
	preview: PreviewSVG,
	options: {
		standard: [
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
										placeholder: '$t:interfaces.select-dropdown.choices_value_placeholder',
									},
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
			{
				field: 'icon',
				name: '$t:icon',
				type: 'string',
				meta: {
					width: 'half',
					interface: 'select-icon',
				},
			},
		],
		advanced: [
			{
				field: 'previewThreshold',
				name: '$t:interfaces.select-dropdown.preview_threshold',
				type: 'integer',
				meta: {
					width: 'half',
					interface: 'input',
				},
				schema: {
					default_value: 3,
				},
			},
		],
	},
	recommendedDisplays: ['labels'],
});
