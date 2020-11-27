import { defineInterface } from '@/interfaces/define';
import InterfaceNotice from './notice.vue';

export default defineInterface(({ i18n }) => ({
	id: 'notice',
	name: i18n.t('interfaces.notice.notice'),
	description: i18n.t('interfaces.notice.description'),
	icon: 'info',
	component: InterfaceNotice,
	hideLabel: true,
	hideLoader: true,
	types: ['alias'],
	groups: ['presentation'],
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
					choices: [
						{ text: i18n.t('normal'), value: 'normal' },
						{ text: i18n.t('info'), value: 'info' },
						{ text: i18n.t('success'), value: 'success' },
						{ text: i18n.t('warning'), value: 'warning' },
						{ text: i18n.t('danger'), value: 'danger' },
					],
				},
			},
			schema: {
				default_value: 'normal',
			},
		},
		{
			field: 'icon',
			name: i18n.t('icon'),
			type: 'string',
			meta: {
				width: 'half',
				interface: 'icon',
			},
		},
		{
			field: 'text',
			name: i18n.t('text'),
			type: 'string',
			meta: {
				width: 'full',
				interface: 'textarea',
				options: {
					placeholder: i18n.t('interfaces.notice.text'),
				},
			},
		},
	],
}));
