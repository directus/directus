import { defineInterface } from '@/interfaces/define';
import InterfaceDropdownMultiselect from './dropdown-multiselect.vue';

export default defineInterface(({ i18n }) => ({
	id: 'dropdown-multiselect',
	name: i18n.t('dropdown_multiple'),
	icon: 'arrow_drop_down_circle',
	component: InterfaceDropdownMultiselect,
	types: ['json'],
	options: [
		{
			field: 'choices',
			type: 'json',
			name: i18n.t('choices'),
			meta: {
				width: 'full',
				interface: 'repeater',
				options: {
					template: '{{ text }}',
					fields: [
						{
							field: 'text',
							type: 'string',
							name: i18n.t('text'),
							meta: {
								interface: 'text-input',
							}
						},
						{
							field: 'value',
							type: 'string',
							name: i18n.t('value'),
							meta: {
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
			meta: {
				width: 'half',
				interface: 'toggle',
				default_value: false,
			}
		},
		{
			field: 'allowNone',
			name: i18n.t('allow_none'),
			type: 'boolean',
			meta: {
				width: 'half',
				interface: 'toggle',
				default_value: false,
			}
		},
		{
			field: 'icon',
			name: i18n.t('icon'),
			type: 'string',
			meta: {
				width: 'half',
				interface: 'icon',
			}
		},
	],
}));
