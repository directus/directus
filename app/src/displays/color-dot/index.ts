import { defineDisplay } from '@/displays/define';
import DisplayColorDot from './color-dot.vue';

export default defineDisplay(({ i18n }) => ({
	id: 'color-dot',
	name: i18n.t('color_dot'),
	types: ['string'],
	icon: 'flag',
	handler: DisplayColorDot,
	options: [
		{
			field: 'defaultColor',
			name: i18n.t('default_color'),
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
				note: i18n.t('displays.color-dot.choices-note'),
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
							field: 'color',
							name: i18n.t('color'),
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
