import { defineOperationApp } from '@directus/shared/utils';

export default defineOperationApp({
	id: 'trigger',
	icon: 'flag',
	name: '$t:operations.trigger.name',
	description: '$t:operations.trigger.description',
	preview: ({ name, options }) => `
# ${name}
**$t:operations.trigger.flow**: ${options.flow}
	`,
	options: [
		{
			field: 'flow',
			name: '$t:operations.trigger.flow',
			type: 'string',
			meta: {
				width: 'full',
				interface: 'input',
				options: {
					iconRight: 'bolt',
				},
			},
		},
		{
			field: 'data',
			name: '$t:operations.trigger.data',
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
