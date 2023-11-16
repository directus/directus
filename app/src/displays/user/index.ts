import { defineDisplay } from '@directus/extensions';
import DisplayUser from './user.vue';
import { userName } from '@/utils/user-name';

export default defineDisplay({
	id: 'user',
	name: '$t:displays.user.user',
	description: '$t:displays.user.description',
	types: ['uuid', 'string'],
	localTypes: ['m2o'],
	icon: 'person',
	component: DisplayUser,
	handler: (value) => userName(value),
	options: [
		{
			field: 'display',
			name: '$t:display',
			type: 'string',
			meta: {
				width: 'half',
				interface: 'select-dropdown',
				options: {
					choices: [
						{
							text: '$t:displays.user.avatar',
							value: 'avatar',
						},
						{
							text: '$t:displays.user.name',
							value: 'name',
						},
						{
							text: '$t:displays.user.both',
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
			name: '$t:circle',
			type: 'boolean',
			meta: {
				width: 'half',
				interface: 'boolean',
				options: {
					label: '$t:displays.user.circle_label',
				},
			},
			schema: {
				default_value: false,
			},
		},
	],
	fields: ['id', 'avatar.id', 'email', 'first_name', 'last_name'],
});
