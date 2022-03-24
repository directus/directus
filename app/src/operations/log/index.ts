import { defineOperationApp } from '@directus/shared/utils';

export default defineOperationApp({
	id: 'log',
	icon: 'print',
	name: '$t:log',
	description: 'Log something in the console!',
	preview: (options) => ({
		test: 'Hi',
	}),
	options: [
		{
			field: 'message',
			name: '$t:message',
			type: 'string',
			meta: {
				width: 'full',
				interface: 'input',
			},
		},
	],
});
