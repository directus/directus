import { defineOperationApp } from '@directus/shared/utils';

export default defineOperationApp({
	id: 'sleep',
	icon: 'schedule',
	name: '$t:sleep',
	description: 'Wait for x miliseconds!',
	preview: (options) => ({
		test: 'Hi',
	}),
	options: [
		{
			field: 'milliseconds',
			name: '$t:milliseconds',
			type: 'integer',
			meta: {
				width: 'full',
				interface: 'input',
				options: {
					min: 0,
					type: 'integer',
				},
			},
		},
	],
});
