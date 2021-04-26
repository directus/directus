import { defineInterface } from '@/interfaces/define';
import InterfaceNotice from './notice.vue';

export default defineInterface({
	id: 'notice',
	name: '$t:interfaces.notice.notice',
	description: '$t:interfaces.notice.description',
	icon: 'info',
	component: InterfaceNotice,
	hideLabel: true,
	hideLoader: true,
	types: ['alias'],
	groups: ['presentation'],
	options: [
		{
			field: 'color',
			name: '$t:color',
			type: 'string',
			meta: {
				width: 'half',
				interface: 'dropdown',
				options: {
					choices: [
						{ text: '$t:normal', value: 'normal' },
						{ text: '$t:info', value: 'info' },
						{ text: '$t:success', value: 'success' },
						{ text: '$t:warning', value: 'warning' },
						{ text: '$t:danger', value: 'danger' },
					],
				},
			},
			schema: {
				default_value: 'normal',
			},
		},
		{
			field: 'icon',
			name: '$t:icon',
			type: 'string',
			meta: {
				width: 'half',
				interface: 'icon',
			},
		},
		{
			field: 'text',
			name: '$t:text',
			type: 'string',
			meta: {
				width: 'full',
				interface: 'textarea',
				options: {
					placeholder: '$t:interfaces.notice.text',
				},
			},
		},
	],
});
