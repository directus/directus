import { defineDisplay } from '@/displays/define';
import DisplayBadge from './badge.vue';

export default defineDisplay(({ i18n }) => ({
	id: 'badge',
	name: i18n.t('badge'),
	types: ['string', 'json'],
	icon: 'flag',
	handler: DisplayBadge,
	options: [
		{
			field: 'format',
			name: i18n.t('format_text'),
			type: 'boolean',
			meta: {
				width: 'half',
				interface: 'toggle',
			},
			schema: {
				default_value: true,
			},
		},
		{
			field: 'defaultForeground',
			name: i18n.t('default_foreground'),
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
			name: i18n.t('default_background'),
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
			field: 'choices',
			name: i18n.t('choices'),
			type: 'json',
			meta: {
				interface: 'repeater',
				options: {
					template: '{{text}}',
					fields: [
						{
							field: 'value',
							name: i18n.t('value'),
							type: 'string',
							meta: {
								interface: 'text-input',
								options: {
									font: 'monospace',
								},
								width: 'half',
							},
						},
						{
							field: 'text',
							name: i18n.t('text'),
							type: 'string',
							meta: {
								interface: 'text-input',
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
