import { defineDisplay } from '@/displays/define';
import DisplayBadge from './badge.vue';

export default defineDisplay(({ i18n }) => ({
	id: 'badge',
	name: i18n.t('badge'),
	types: ['string'],
	icon: 'flag',
	handler: DisplayBadge,
	options: [
		{
			field: 'defaultForeground',
			name: i18n.t('default_foreground'),
			type: 'string',
			meta: {
				interface: 'color',
				width: 'half',
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
