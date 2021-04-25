import { defineInterface } from '@/interfaces/define';
import InterfaceColor from './color.vue';

export default defineInterface({
	id: 'color',
	name: '$t:interfaces.color.color',
	description: '$t:interfaces.color.description',
	icon: 'palette',
	component: InterfaceColor,
	types: ['string'],
	recommendedDisplays: ['color'],
	options: [
		{
			field: 'presets',
			name: '$t:interfaces.color.preset_colors',
			type: 'string',
			meta: {
				width: 'full',
				interface: 'repeater',
				options: {
					addLabel: '$t:interfaces.color.preset_colors_add_label',
					template: '{{ name }} - {{ color }}',
					fields: [
						{
							field: 'name',
							type: 'string',
							name: '$t:name',
							meta: {
								interface: 'text-input',
								width: 'half',
								options: {
									placeholder: '$t:interfaces.color.name_placeholder',
								},
							},
						},
						{
							field: 'color',
							type: 'string',
							name: '$t:color',
							meta: {
								interface: 'color',
								width: 'half',
							},
						},
					],
				},
			},
		},
	],
});
