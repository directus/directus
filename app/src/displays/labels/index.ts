import { defineDisplay } from '@directus/extensions';
import DisplayLabels from './labels.vue';

export default defineDisplay({
	id: 'labels',
	name: '$t:displays.labels.labels',
	description: '$t:displays.labels.description',
	types: ['string', 'json', 'csv', 'integer', 'float', 'decimal', 'bigInteger'],
	icon: 'flag',
	component: DisplayLabels,
	handler: (value, options, { interfaceOptions }) => {
		if (Array.isArray(value)) {
			return value.map((val) => getConfiguredChoice(val)).join(', ');
		} else {
			return getConfiguredChoice(value);
		}

		function getConfiguredChoice(val: string | number) {
			const configuredChoice =
				options?.choices?.find((choice: { value: string | number }) => choice.value === val) ??
				interfaceOptions?.choices?.find((choice: { value: string | number }) => choice.value === val);

			return configuredChoice?.text ? configuredChoice.text : val;
		}
	},
	options: [
		{
			field: 'format',
			name: '$t:format_text',
			type: 'boolean',
			meta: {
				width: 'half',
				interface: 'boolean',
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
				interface: 'boolean',
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
				interface: 'list',
				options: {
					template: '{{text}}',
					fields: [
						{
							field: 'text',
							name: '$t:text',
							type: 'string',
							meta: {
								interface: 'system-input-translated-string',
								width: 'half',
								required: true,
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
								interface: 'input',
								options: {
									font: 'monospace',
									placeholder: '$t:displays.labels.choices_value_placeholder',
								},
								required: true,
								width: 'half',
							},
						},
						{
							field: 'icon',
							name: '$t:icon',
							type: 'string',
							meta: {
								interface: 'select-icon',
								width: 'half',
							},
						},
						{
							field: 'color',
							name: '$t:color',
							type: 'string',
							meta: {
								interface: 'select-color',
								width: 'half',
							},
						},
						{
							field: 'foreground',
							name: '$t:foreground_color',
							type: 'string',
							meta: {
								interface: 'select-color',
								width: 'half',
							},
						},
						{
							field: 'background',
							name: '$t:background_color',
							type: 'string',
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
});
