import { defineDisplay } from '@/displays/define';
import DisplayLabels from './labels.vue';

export default defineDisplay({
	id: 'labels',
	name: '$t:displays.labels.labels',
	description: '$t:displays.labels.description',
	types: ['string', 'json', 'csv'],
	icon: 'flag',
	handler: DisplayLabels,
	options: [
		{
			field: 'defaultForeground',
			name: '$t:displays.labels.default_foreground',
			type: 'string',
			meta: {
				interface: 'color',
				width: 'half',
			},
			schema: {
				default_value: '#263238',
			},
		},
		{
			field: 'defaultBackground',
			name: '$t:displays.labels.default_background',
			type: 'string',
			meta: {
				interface: 'color',
				width: 'half',
			},
			schema: {
				default_value: '#eceff1',
			},
		},
		{
			field: 'format',
			name: '$t:format_text',
			type: 'boolean',
			meta: {
				width: 'half',
				interface: 'toggle',
				options: {
					label: '$t:displays.labels.format_label',
				},
			},
			schema: {
				default_value: true,
			},
		},
		{
			field: 'showAsDot',
			name: '$t:displays.labels.show_as_dot',
			type: 'boolean',
			meta: {
				width: 'half',
				interface: 'toggle',
			},
			schema: {
				default_value: false,
			},
		},
		{
			field: 'choices',
			name: '$t:choices',
			type: 'json',
			meta: {
				interface: 'repeater',
				options: {
					template: '{{text}}',
					fields: [
						{
							field: 'text',
							name: '$t:text',
							type: 'string',
							meta: {
								interface: 'text-input',
								width: 'half',
								options: {
									placeholder: '$t:displays.labels.choices_text_placeholder',
								},
							},
						},
						{
							field: 'value',
							name: '$t:value',
							type: 'string',
							meta: {
								interface: 'text-input',
								options: {
									font: 'monospace',
									placeholder: '$t:displays.labels.choices_value_placeholder',
								},
								width: 'half',
							},
						},
						{
							field: 'foreground',
							name: '$t:foreground_color',
							type: 'string',
							meta: {
								interface: 'color',
								width: 'half',
							},
						},
						{
							field: 'background',
							name: '$t:background_color',
							type: 'string',
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
