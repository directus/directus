import InterfaceUser from './user.vue';
import { defineInterface } from '@/interfaces/define';

export default defineInterface({
	id: 'user',
	name: '$t:interfaces.user.user',
	description: '$t:interfaces.user.description',
	icon: 'person',
	component: InterfaceUser,
	types: ['uuid'],
	relational: true,
	options: [
		{
			field: 'selectMode',
			name: '$t:interfaces.user.select_mode',
			type: 'string',
			meta: {
				width: 'full',
				interface: 'dropdown',
				options: {
					choices: [
						{ text: '$t:interfaces.user.modes.auto', value: 'auto' },
						{ text: '$t:interfaces.user.modes.dropdown', value: 'dropdown' },
						{ text: '$t:interfaces.user.modes.modal', value: 'modal' },
					],
				},
			},
			schema: {
				default_value: 'auto',
			},
		},
	],
	recommendedDisplays: ['user'],
});
