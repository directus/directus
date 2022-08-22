import { defineOperationApp } from '@directus/shared/utils';

export default defineOperationApp({
	id: 'notification',
	icon: 'notifications',
	name: '$t:operations.notification.name',
	description: '$t:operations.notification.description',
	overview: ({ subject, message }) => [
		{
			label: '$t:subject',
			text: subject,
		},
		{
			label: '$t:message',
			text: message,
		},
	],
	options: [
		{
			field: 'recipient',
			name: '$t:operations.notification.recipient',
			type: 'csv',
			meta: {
				width: 'half',
				interface: 'tags',
				options: {
					iconRight: 'people_alt',
					placeholder: '$t:operations.notification.recipient_placeholder',
				},
			},
		},
		{
			field: 'permissions',
			name: '$t:permissions',
			type: 'string',
			schema: {
				default_value: '$trigger',
			},
			meta: {
				width: 'half',
				interface: 'select-dropdown',
				options: {
					choices: [
						{
							text: 'From Trigger',
							value: '$trigger',
						},
						{
							text: 'Public Role',
							value: '$public',
						},
						{
							text: 'Full Access',
							value: '$full',
						},
					],
					allowOther: true,
				},
			},
		},
		{
			field: 'subject',
			name: '$t:title',
			type: 'string',
			meta: {
				width: 'full',
				interface: 'input',
				options: {
					iconRight: 'title',
				},
			},
		},
		{
			field: 'message',
			name: '$t:operations.notification.message',
			type: 'text',
			meta: {
				width: 'full',
				interface: 'input-rich-text-md',
			},
		},
	],
});
