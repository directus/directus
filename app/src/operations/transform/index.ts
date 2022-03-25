import { defineOperationApp } from '@directus/shared/utils';

export default defineOperationApp({
	id: 'transform',
	icon: 'move_down',
	name: '$t:transform',
	description: 'Insert Json into the flow!',
	preview: (options) => ({
		test: 'Hi',
	}),
	options: [
		{
			field: 'json',
			name: '$t:json',
			type: 'string',
			meta: {
				width: 'full',
				interface: 'input-code',
                options: {
                    language: 'json'
                }
			},
		},
	],
});
