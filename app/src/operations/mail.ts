import { defineOperationApp } from '@directus/shared/utils';

export default defineOperationApp({
	id: 'mail',
	icon: 'mail',
	name: 'mail',
	description: 'Send emails to other humans!',
	preview: (options) => ({
		test: 'Hi',
	}),
	options: [
		{
			field: 'template',
			type: 'string',
			meta: {
				interface: 'input',
			},
		},
		{
			field: 'data',
			type: 'string',
			meta: {
				interface: 'input-code',
			},
		},
		{
			field: 'to',
			type: 'string',
			meta: {
				interface: 'input',
			},
		},
		{
			field: 'subject',
			type: 'string',
			meta: {
				interface: 'tags',
			},
		},
	],
});
