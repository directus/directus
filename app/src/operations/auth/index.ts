import { defineOperationApp } from '@directus/shared/utils';

export default defineOperationApp({
	id: 'auth',
	icon: 'lock_open',
	name: '$t:auth',
	description: 'Check if something can be performed with a given filter!',
	preview: (options) => ({
		test: 'Hi',
	}),
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
                    collectionName: options['collection']
                }
			},
		},
	],
});
