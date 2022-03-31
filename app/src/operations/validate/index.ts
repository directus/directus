import { defineOperationApp } from '@directus/shared/utils';

export default defineOperationApp({
	id: 'validate',
	icon: 'beenhere',
	name: '$t:operations.validate.name',
	description: '$t:operations.validate.description',
	preview: ({ name, options }) => `
# ${name}
**$t:collection**: ${options.collection}\n
**$t:item**: ${options.item}
	`,
	options: (options: Record<string, any>) => [
		{
			field: 'collection',
			name: '$t:collection',
			type: 'string',
			meta: {
				width: 'full',
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
		{
			field: 'item',
			name: '$t:item',
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
