import { defineInterface } from '@directus/extensions';
import PreviewSVG from './preview.svg?raw';
import InterfaceSelectCardCheckbox from './select-card-checkbox.vue';

export default defineInterface({
	id: 'select-card-checkbox',
	name: '$t:interfaces.select-card-checkbox.card-select-multiple',
	description: '$t:interfaces.select-card-checkbox.description',
	icon: 'fact_check',
	component: InterfaceSelectCardCheckbox,
	types: ['json', 'csv'],
	recommendedDisplays: ['labels'],
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
								required: true,
								interface: 'system-input-translated-string',
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
								},
							},
						},
						{
							field: 'description',
							type: 'string',
							name: '$t:description',
							meta: {
								width: 'full',
								interface: 'system-input-translated-string',
								note: '$t:interfaces.select-card-checkbox.description_note',
							},
						},
						{
							field: 'icon_type',
							type: 'string',
							name: '$t:interfaces.select-card-checkbox.icon_type',
							meta: {
								width: 'full',
								interface: 'select-radio',
								options: {
									choices: [
										{ text: '$t:icon', value: 'icon' },
										{ text: '$t:image', value: 'image' },
										{ text: 'SVG', value: 'svg' },
									],
								},
							},
							schema: {
								default_value: 'icon',
							},
						},
						{
							field: 'icon',
							name: '$t:icon',
							type: 'string',
							meta: {
								width: 'full',
								interface: 'select-icon',
								hidden: true,
								conditions: [
									{
										hidden: false,
										rule: {
											_and: [{ icon_type: { _eq: 'icon' } }],
										},
									},
								],
							},
						},
						{
							field: 'svg_icon',
							type: 'text',
							name: 'SVG',
							meta: {
								width: 'full',
								interface: 'input-code',
								options: {
									language: 'htmlmixed',
								},
								hidden: true,
								conditions: [
									{
										hidden: false,
										rule: {
											_and: [{ icon_type: { _eq: 'svg' } }],
										},
									},
								],
							},
						},
						{
							field: 'image',
							name: '$t:image',
							type: 'string',
							meta: {
								width: 'full',
								interface: 'system-file-image',
								hidden: true,
								conditions: [
									{
										hidden: false,
										rule: {
											_and: [{ icon_type: { _eq: 'image' } }],
										},
									},
								],
							},
						},
					],
				},
			},
		},
		{
			field: 'enableSearch',
			type: 'boolean',
			name: '$t:interfaces.select-card-checkbox.enable_search',
			meta: {
				width: 'half',
				interface: 'boolean',
				options: {
					label: '$t:interfaces.select-card-checkbox.enable_search',
				},
			},
			schema: {
				default_value: false,
			},
		},
		{
			field: 'gridSize',
			type: 'integer',
			name: '$t:interfaces.select-card-checkbox.grid_size',
			meta: {
				width: 'half',
				interface: 'select-dropdown',
				options: {
					choices: [
						{ text: '2', value: 2 },
						{ text: '3', value: 3 },
						{ text: '4', value: 4 },
						{ text: '5', value: 5 },
						{ text: '6', value: 6 },
					],
				},
			},
			schema: {
				default_value: 4,
			},
		},
	],
});
