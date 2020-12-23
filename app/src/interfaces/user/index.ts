import InterfaceUser from './user.vue';
import { defineInterface } from '@/interfaces/define';

export default defineInterface(({ i18n }) => ({
	id: 'user',
	name: i18n.t('interfaces.user.user'),
	description: i18n.t('interfaces.user.description'),
	icon: 'person',
	component: InterfaceUser,
	types: ['uuid'],
	relational: true,
	options: [
		{
			field: 'selectMode',
			name: i18n.t('interfaces.user.select_mode'),
			type: 'string',
			meta: {
				width: 'full',
				interface: 'dropdown',
				options: {
					choices: [
						{ text: i18n.t('interfaces.user.modes.auto'), value: 'auto' },
						{ text: i18n.t('interfaces.user.modes.dropdown'), value: 'dropdown' },
						{ text: i18n.t('interfaces.user.modes.modal'), value: 'modal' },
					],
				},
			},
			schema: {
				default_value: 'auto',
			},
		},
	],
	recommendedDisplays: ['user'],
}));
