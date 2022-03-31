import { defineOperationApp } from '@directus/shared/utils';

export default defineOperationApp({
	id: 'transform',
	icon: 'move_down',
	name: '$t:operations.transform.name',
	description: '$t:operations.transform.description',
	preview: ({ name, options }) => `
# ${name}
**$t:json**: ${options.json}
	`,
	options: [
		{
			field: 'json',
			name: '$t:json',
			type: 'string',
			meta: {
				width: 'full',
				interface: 'input-code',
				options: {
					language: 'json',
				},
			},
		},
	],
});
