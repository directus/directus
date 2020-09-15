import InterfaceToggle from './toggle.vue';
import { defineInterface } from '@/interfaces/define';

export default defineInterface(({ i18n }) => ({
	id: 'toggle',
	name: i18n.t('interfaces.toggle.toggle'),
	description: i18n.t('interfaces.toggle.description'),
	icon: 'check_box',
	component: InterfaceToggle,
	types: ['boolean'],
	recommendedDisplays: ['boolean'],
	options: [
		{
			field: 'iconOff',
			name: i18n.t('icon_off'),
			type: 'string',
			meta: {
				width: 'half',
				interface: 'icon',
			},
		},
		{
			field: 'iconOn',
			name: i18n.t('icon_on'),
			type: 'string',
			meta: {
				width: 'half',
				interface: 'icon',
			},
		},
		{
			field: 'label',
			name: i18n.t('label'),
			type: 'string',
			meta: {
				width: 'half',
				interface: 'text-input',
				options: {
					placeholder: i18n.t('interfaces.toggle.label_placeholder'),
				},
			},
			schema: {
				default_value: i18n.t('interfaces.toggle.label_default'),
			},
		},
		{
			field: 'color',
			name: i18n.t('color'),
			type: 'string',
			meta: {
				width: 'half',
				interface: 'color',
			},
		},
	],
}));
