import { defineDisplay } from '@/displays/define';
import DisplayLabels from './labels.vue';

export default defineDisplay(({ i18n }) => ({
	id: 'labels',
	name: i18n.t('displays.labels.labels'),
	description: i18n.t('displays.labels.description'),
	types: ['string', 'json', 'csv'],
	icon: 'flag',
	handler: DisplayLabels,
	options: [
		{
			field: 'defaultForeground',
			name: i18n.t('displays.labels.default_foreground'),
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
			name: i18n.t('displays.labels.default_background'),
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
			name: i18n.t('format_text'),
			type: 'boolean',
			meta: {
				width: 'half',
				interface: 'toggle',
				options: {
					label: i18n.t('displays.labels.format_label'),
				},
			},
			schema: {
				default_value: true,
			},
		},
		{
			field: 'showAsDot',
			name: i18n.t('displays.labels.show_as_dot'),
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
			name: i18n.t('choices'),
			type: 'json',
			meta: {
				interface: 'repeater',
				options: {
					template: '{{text}}',
					fields: [
						{
							field: 'text',
							name: i18n.t('text'),
							type: 'string',
							meta: {
								interface: 'text-input',
								width: 'half',
								options: {
									placeholder: i18n.t('displays.labels.choices_text_placeholder'),
								},
							},
						},
						{
							field: 'value',
							name: i18n.t('value'),
							type: 'string',
							meta: {
								interface: 'text-input',
								options: {
									font: 'monospace',
									placeholder: i18n.t('displays.labels.choices_value_placeholder'),
								},
								width: 'half',
							},
						},
						{
							field: 'foreground',
							name: i18n.t('foreground_color'),
							type: 'string',
							meta: {
								interface: 'color',
								width: 'half',
							},
						},
						{
							field: 'background',
							name: i18n.t('background_color'),
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
}));
