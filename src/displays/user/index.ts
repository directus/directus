import { defineDisplay } from '@/displays/define';
import DisplayUser from './user.vue';

export default defineDisplay(({ i18n }) => ({
	id: 'user',
	name: i18n.t('user'),
	types: ['user', 'owner', 'user_modified'],
	icon: 'person',
	handler: DisplayUser,
	options: [
		{
			field: 'display',
			name: i18n.t('display'),
			default_value: 'avatar',
			interface: 'dropdown',
			options: {
				choices: `
				avatar :: Avatar
				name :: Name
				`,
			},
		},
	],
	fields: ['id', 'avatar.data', 'first_name', 'last_name'],
}));
