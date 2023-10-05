import { defineInterface } from '@directus/extensions';
import InterfaceColor from './select-color.vue';
import PreviewSVG from './preview.svg?raw';

export default defineInterface({
	id: 'select-color',
	name: '$t:interfaces.select-color.color',
	description: '$t:interfaces.select-color.description',
	icon: 'palette',
	component: InterfaceColor,
	types: ['string'],
	recommendedDisplays: ['color'],
	group: 'selection',
	options: [
		{
			field: 'opacity',
			name: '$t:interfaces.select-color.opacity',
			type: 'boolean',
			meta: {
				width: 'half',
				interface: 'boolean',
			},
			schema: {
				default_value: false,
			},
		},
		{
			field: 'presets',
			name: '$t:interfaces.select-color.preset_colors',
			type: 'json',
			meta: {
				width: 'full',
				interface: 'list',
				options: {
					addLabel: '$t:interfaces.select-color.preset_colors_add_label',
					template: '{{ name }} - {{ color }}',
					fields: [
						{
							field: 'name',
							type: 'string',
							name: '$t:name',
							meta: {
								interface: 'system-input-translated-string',
								width: 'half',
								required: true,
								options: {
									placeholder: '$t:interfaces.select-color.name_placeholder',
								},
							},
						},
						{
							field: 'color',
							type: 'string',
							name: '$t:color',
							meta: {
								interface: 'select-color',
								width: 'half',
							},
						},
					],
				},
			},
		},
	],
	preview: PreviewSVG,
});
