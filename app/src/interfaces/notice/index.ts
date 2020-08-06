import { defineInterface } from '@/interfaces/define';
import InterfaceNotice from './notice.vue';

export default defineInterface(({ i18n }) => ({
	id: 'notice',
	name: i18n.t('notice'),
	icon: 'remove',
	component: InterfaceNotice,
	hideLabel: true,
	hideLoader: true,
	types: ['alias'],
	options: [
		{
			field: 'color',
			name: i18n.t('color'),
			type: 'string',
			meta: {
				width: 'half',
				interface: 'dropdown',
				default_value: 'normal',
				options: {
					items: [
						{ itemText: i18n.t('normal'), itemValue: 'normal' },
						{ itemText: i18n.t('info'), itemValue: 'info' },
						{ itemText: i18n.t('success'), itemValue: 'success' },
						{ itemText: i18n.t('warning'), itemValue: 'warning' },
						{ itemText: i18n.t('danger'), itemValue: 'danger' },
					],
				},
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
		{
			field: 'text',
			name: i18n.t('text'),
			type: 'string',
			meta: {
				width: 'full',
				interface: 'textarea',
			}
		},
	],
}));
