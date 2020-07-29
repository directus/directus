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
		{
			field: 'placeholder',
			name: i18n.t('placeholder'),
			width: 'half',
			interface: 'text-input',
		},
	],
}));
