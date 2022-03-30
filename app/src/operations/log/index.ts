import { defineOperationApp } from '@directus/shared/utils';

export default defineOperationApp({
	id: 'log',
	icon: 'print',
	name: '$t:operations.log.name',
	description: '$t:operations.log.description',
	preview: (options) => `
# ${options.name}
**Message:** ${options.options.message}
	`,
	options: [
		{
			field: 'message',
			name: '$t:operations.log.message',
			type: 'string',
			meta: {
				width: 'full',
				interface: 'input',
				options: {
					placeholder: '$t:operations.log.message_placeholder',
				},
			},
		},
	],
});
