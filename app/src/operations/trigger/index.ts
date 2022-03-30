import { defineOperationApp } from '@directus/shared/utils';

export default defineOperationApp({
	id: 'trigger',
	icon: 'flag',
	name: '$t:operations.trigger.name',
	description: '$t:operations.trigger.description',
	preview: (options) => `# ${options.name}`,
	options: [
		{
			field: 'flow',
			name: '$t:operations.trigger.flow',
			type: 'string',
			meta: {
				width: 'half',
				interface: 'input',
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
