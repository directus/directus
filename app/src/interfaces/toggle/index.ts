import InterfaceToggle from './toggle.vue';
import { defineInterface } from '@/interfaces/define';

export default defineInterface(({ i18n }) => ({
	id: 'toggle',
	name: i18n.t('toggle'),
	icon: 'check_box',
	component: InterfaceToggle,
	types: ['boolean'],
	options: [
		{
			field: 'iconOff',
			name: i18n.t('icon_off'),
			type: 'string',
			meta: {
				width: 'half',
				interface: 'icon',
				default_value: 'check_box_outline_blank',
			}
		},
		{
			field: 'iconOn',
			name: i18n.t('icon_on'),
			type: 'string',
			meta: {
				width: 'half',
				interface: 'icon',
				default_value: 'check_box',
			}
		},
		{
			field: 'label',
			name: i18n.t('label'),
			type: 'string',
			meta: {
				width: 'half',
				interface: 'text-input',
				default_value: i18n.t('active'),
			}
		},
		{
			field: 'color',
			name: i18n.t('color'),
			type: 'string',
			meta: {
				width: 'half',
				interface: 'color',
				default_value: 'var(--primary)',
			}
		},
	],
}));
