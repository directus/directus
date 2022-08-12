import { defineOperationApp } from '@directus/shared/utils';

export default defineOperationApp({
	id: 'exec',
	icon: 'code',
	name: 'code',
	description: 'code',
	overview: () => [],
	options: [
		{
			field: 'code',
			name: '$t:code',
			type: 'string',
			meta: {
				width: 'full',
				interface: 'input-code',
				options: {
					language: 'javascript',
				},
			},
		},
	],
});
