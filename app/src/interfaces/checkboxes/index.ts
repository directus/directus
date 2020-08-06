import { defineInterface } from '@/interfaces/define';
import InterfaceCheckboxes from './checkboxes.vue';

export default defineInterface(({ i18n }) => ({
	id: 'checkboxes',
	name: i18n.t('checkboxes'),
	icon: 'radio_button_checked',
	component: InterfaceCheckboxes,
	types: ['json'],
	options: [
		{
			field: 'choices',
			type: 'json',
			name: i18n.t('choices'),
			system: {
				width: 'full',
				interface: 'repeater',
				options: {
					template: '{{ text }}',
					fields: [
						{
							field: 'text',
							type: 'string',
							name: i18n.t('text'),
							system: {
								interface: 'text-input',
							}
						},
						{
							field: 'value',
							type: 'string',
							name: i18n.t('value'),
							system: {
								interface: 'text-input',
								options: {
									font: 'monospace'
								},
							}
						},
					]
				}
			}
		},
		{
			field: 'allowOther',
			name: i18n.t('allow_other'),
			type: 'boolean',
			system: {
				width: 'half',
				interface: 'toggle',
			},
			database: {
				default_value: false,
			}
		},
		{
			field: 'iconOff',
			name: i18n.t('icon_off'),
			type: 'string',
			system: {
				width: 'half',
				interface: 'icon',
			},
			database: {
				default_value: 'check_box_outline_blank',
			}
		},
		{
			field: 'iconOn',
			name: i18n.t('icon_on'),
			type: 'string',
			system: {
				width: 'half',
				interface: 'icon',
			},
			database: {
				default_value: 'check_box',
			}
		},
		{
			field: 'color',
			name: i18n.t('color'),
			type: 'string',
			system: {
				width: 'half',
				interface: 'color',
			},
			database: {
				default_value: '#2f80ed',
			}
		},
	],
}));
