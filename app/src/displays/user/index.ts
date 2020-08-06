import { defineDisplay } from '@/displays/define';
import DisplayUser from './user.vue';

export default defineDisplay(({ i18n }) => ({
	id: 'user',
	name: i18n.t('user'),
	types: ['uuid'],
	icon: 'person',
	handler: DisplayUser,
	options: [
		{
			field: 'display',
			name: i18n.t('display'),
			type: 'string',
			system: {
				default_value: 'avatar',
				interface: 'dropdown',
				options: [
					{
						text: i18n.t('avatar'),
						value: 'avatar',
					},
					{
						text: i18n.t('name'),
						value: 'name',
					},
					{
						text: i18n.t('both'),
						value: 'both',
					},
				]
			}
		},
		{
			field: 'circle',
			name: i18n.t('circle'),
			type: 'boolean',
			system: {
				width: 'half',
				interface: 'toggle',
				default_value: false,
			}
		},
	],
	fields: ['id', 'avatar.id', 'first_name', 'last_name'],
}));
