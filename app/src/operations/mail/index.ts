import { defineOperationApp } from '@directus/shared/utils';

export default defineOperationApp({
	id: 'mail',
	icon: 'mail',
	name: '$t:email',
	description: 'Send emails to other humans!',
	preview: (options) => ({
		test: 'Hi',
	}),
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
			field: 'to',
			name: '$t:to',
			type: 'string',
			meta: {
				width: 'half',
				interface: 'tags',
			},
		},
		{
			field: 'template',
			name: '$t:template',
			type: 'string',
			meta: {
				width: 'full',
				interface: 'input-rich-text-md',
			},
		},
		{
			field: 'data',
			name: '$t:data',
			type: 'string',
			meta: {
				interface: 'input-code',
			},
		},
	],
});
