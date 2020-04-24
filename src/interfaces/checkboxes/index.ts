import { defineInterface } from '@/interfaces/define';
import InterfaceCheckboxes from './checkboxes.vue';

export default defineInterface(({ i18n }) => ({
	id: 'checkboxes',
	name: i18n.t('checkboxes'),
	icon: 'radio_button_checked',
	component: InterfaceCheckboxes,
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
			field: 'iconOff',
			name: i18n.t('icon_off'),
			width: 'half',
			interface: 'icon',
			default_value: 'check_box_outline_blank',
		},
		{
			field: 'iconOn',
			name: i18n.t('icon_on'),
			width: 'half',
			interface: 'icon',
			default_value: 'check_box',
		},
		{
			field: 'color',
			name: i18n.t('color'),
			width: 'half',
			interface: 'color',
			default_value: 'var(--primary)',
		},
	],
}));
