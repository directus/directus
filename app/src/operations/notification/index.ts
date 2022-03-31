import { defineOperationApp } from '@directus/shared/utils';

export default defineOperationApp({
	id: 'notification',
	icon: 'notifications',
	name: '$t:operations.notification.name',
	description: '$t:operations.notification.description',
	preview: ({ name, options }) => `
# ${name}
**$t:subject**: ${options.subject}\n
**$t:operations.notification.message**:\n${options.message}
	`,
	options: [
		{
			field: 'subject',
			name: '$t:subject',
			type: 'string',
			meta: {
				width: 'half',
				interface: 'input',
			},
		},
		{
			field: 'recipient',
			name: '$t:operations.notification.recipient',
			type: 'string',
			meta: {
				width: 'half',
				interface: 'input',
			},
		},
		{
			field: 'message',
			name: '$t:operations.notification.message',
			type: 'string',
			meta: {
				width: 'full',
				interface: 'input-rich-text-md',
			},
		},
	],
});
