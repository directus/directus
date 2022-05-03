import { defineOperationApp } from '@directus/shared/utils';

export default defineOperationApp({
	id: 'validate',
	icon: 'beenhere',
	name: '$t:operations.validate.name',
	description: '$t:operations.validate.description',
	preview: ({ item }) => [
		{
			label: '$t:item',
			text: item,
		},
	],
	options: () => [
		{
			field: 'filter',
			name: '$t:filter',
			type: 'json',
			meta: {
				width: 'full',
				interface: 'system-filter',
				options: {
					collectionRequired: false,
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
