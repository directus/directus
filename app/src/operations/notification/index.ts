import { defineOperationApp } from '@directus/shared/utils';

export default defineOperationApp({
	id: 'notification',
	icon: 'notifications',
	name: '$t:notification',
	description: 'Send a notification!',
	preview: (options) => ({
		test: 'Hi',
	}),
	options: [
        {
			field: 'recipient',
			name: '$t:recipient',
			type: 'string',
			meta: {
				width: 'half',
				interface: 'input',
			},
		},
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
			field: 'message',
			name: '$t:message',
			type: 'string',
			meta: {
				width: 'full',
				interface: 'input-multiline',
			},
		},
	],
});
