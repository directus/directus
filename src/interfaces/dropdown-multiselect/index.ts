import { defineInterface } from '@/interfaces/define';
import InterfaceDropdownMultiselect from './dropdown-multiselect.vue';

export default defineInterface(({ i18n }) => ({
	id: 'dropdown-multiselect',
	name: i18n.t('dropdown_multiple'),
	icon: 'arrow_drop_down_circle',
	component: InterfaceDropdownMultiselect,
	types: ['array'],
	options: [
		{
			field: 'choices',
			name: i18n.t('choices'),
			note: i18n.t('use_double_colon_for_key'),
			width: 'full',
			interface: 'textarea',
		},
		{
			field: 'allowOther',
			name: i18n.t('allow_other'),
			width: 'half',
			interface: 'toggle',
			default_value: false,
		},
		{
			field: 'allowNone',
			name: i18n.t('allow_none'),
			width: 'half',
			interface: 'toggle',
			default_value: false,
		},
		{
			field: 'icon',
			name: i18n.t('icon'),
			width: 'half',
			interface: 'icon',
		},
	],
}));
