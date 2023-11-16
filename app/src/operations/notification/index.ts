import { defineOperationApp } from '@directus/extensions';

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
				note: '$t:operations.notification.recipient_note',
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
			name: '$t:operations.notification.subject',
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
		{
			field: 'collection',
			name: '$t:collection',
			type: 'string',
			meta: {
				width: 'half',
				interface: 'system-collection',
			},
		},
		{
			field: 'item',
			name: '$t:item',
			type: 'string',
			meta: {
				width: 'half',
				interface: 'input',
				options: {
					iconRight: 'vpn_key',
				},
				note: '$t:operations.notification.item_note',
			},
		},
	],
});
