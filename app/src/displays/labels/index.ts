import { defineDisplay } from '@directus/shared/utils';
import DisplayLabels from './labels.vue';
import { translate } from '@/utils/translate-object-values';

export default defineDisplay({
	id: 'labels',
	name: '$t:displays.labels.labels',
	description: '$t:displays.labels.description',
	types: ['string', 'json', 'csv'],
	icon: 'flag',
	component: DisplayLabels,
	handler: (value, options, { interfaceOptions }) => {
		const configuredChoice =
			options?.choices?.find((choice: { value: string }) => choice.value === value) ??
			interfaceOptions?.choices?.find((choice: { value: string }) => choice.value === value);

		if (configuredChoice) {
			const { text } = translate(configuredChoice);
			return text;
		}

		return value;
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
