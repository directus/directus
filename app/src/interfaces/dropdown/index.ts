import { defineInterface } from '@/interfaces/define';
import InterfaceDropdown from './dropdown.vue';

export default defineInterface(({ i18n }) => ({
	id: 'dropdown',
	name: i18n.t('dropdown'),
	icon: 'arrow_drop_down_circle',
	component: InterfaceDropdown,
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
			type: 'boolean',
			system: {
				width: 'half',
				interface: 'toggle',
				default_value: false,
			}
		},
		{
			field: 'allowNone',
			name: i18n.t('allow_none'),
			type: 'boolean',
			system: {
				width: 'half',
				interface: 'toggle',
				default_value: false,
			}
		},
		{
			field: 'icon',
			name: i18n.t('icon'),
			type: 'string',
			system: {
				width: 'half',
				interface: 'icon',
			}
		},
		{
			field: 'placeholder',
			name: i18n.t('placeholder'),
			type: 'string',
			system: {
				width: 'half',
				interface: 'text-input',
			}
		},
	],
}));
