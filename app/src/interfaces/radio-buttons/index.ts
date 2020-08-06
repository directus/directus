import { defineInterface } from '@/interfaces/define';
import InterfaceRadioButtons from './radio-buttons.vue';

export default defineInterface(({ i18n }) => ({
	id: 'radio-buttons',
	name: i18n.t('radio_buttons'),
	icon: 'radio_button_checked',
	component: InterfaceRadioButtons,
	types: ['string'],
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
			type: 'string',
			system: {
				width: 'half',
				interface: 'toggle',
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
				default_value: 'var(--primary)',
			}
		},
	],
}));
