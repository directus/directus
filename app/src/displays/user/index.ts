import { defineDisplay } from '@/displays/define';
import DisplayUser from './user.vue';

export default defineDisplay(({ i18n }) => ({
	id: 'user',
	name: i18n.t('displays.user.user'),
	description: i18n.t('displays.user.description'),
	types: ['uuid'],
	icon: 'person',
	handler: DisplayUser,
	options: [
		{
			field: 'display',
			name: i18n.t('display'),
			type: 'string',
			meta: {
				width: 'half',
				interface: 'dropdown',
				options: {
					choices: [
						{
							text: i18n.t('displays.user.avatar'),
							value: 'avatar',
						},
						{
							text: i18n.t('displays.user.name'),
							value: 'name',
						},
						{
							text: i18n.t('displays.user.both'),
							value: 'both',
						},
					],
				},
			},
			schema: {
				default_value: 'both',
			},
		},
		{
			field: 'circle',
			name: i18n.t('circle'),
			type: 'boolean',
			meta: {
				width: 'half',
				interface: 'toggle',
				options: {
					label: i18n.t('displays.user.circle_label'),
				},
			},
			schema: {
				default_value: false,
			},
		},
	],
	fields: ['id', 'avatar.id', 'email', 'first_name', 'last_name'],
}));
