import { defineOperationApp } from '@directus/shared/utils';

export default defineOperationApp({
	id: 'auth',
	icon: 'lock_open',
	name: '$t:operations.auth.name',
	description: '$t:operations.auth.description',
	preview: ({ name, options }) => `
# ${name}
**$t:collection**: ${options.collection}\n
**$t:filter**: ${JSON.stringify(options.filter)}
	`,
	options: (options: Record<string, any>) => [
		{
			field: 'collection',
			name: '$t:collection',
			type: 'string',
			meta: {
				width: 'half',
				interface: 'system-collection',
			},
		},
		{
			field: 'filter',
			name: '$t:filter',
			type: 'json',
			meta: {
				width: 'full',
				interface: 'system-filter',
				options: {
					collectionName: options['collection'],
				},
			},
		},
	],
});
