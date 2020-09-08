import { defineDisplay } from '@/displays/define';
import DisplayColorDot from './color-dot.vue';

export default defineDisplay(({ i18n }) => ({
	id: 'color-dot',
	name: i18n.t('displays.color-dot.color-dot'),
	description: i18n.t('displays.color-dot.description'),
	types: ['string'],
	icon: 'flag',
	handler: DisplayColorDot,
	options: [
		{
			field: 'defaultColor',
			name: i18n.t('displays.color-dot.default_color'),
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
				note: i18n.t('displays.color-dot.choices_note'),
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
