import InterfaceUser from './user.vue';
import { defineInterface } from '@/interfaces/define';

export default defineInterface(({ i18n }) => ({
	id: 'user',
	name: i18n.t('user'),
	icon: 'person',
	component: InterfaceUser,
	types: ['uuid'],
	options: [
		{
			field: 'selectMode',
			name: i18n.t('select_mode'),
			type: 'string',
			meta: {
				width: 'full',
				interface: 'dropdown',
				options: {
					choices: [
						{ text: 'Auto', value: 'auto' },
						{ text: 'Dropdown', value: 'dropdown' },
						{ text: 'Modal', value: 'modal' },
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
