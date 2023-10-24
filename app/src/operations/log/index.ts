import { defineOperationApp } from '@directus/extensions';

export default defineOperationApp({
	id: 'log',
	icon: 'terminal',
	name: '$t:operations.log.name',
	description: '$t:operations.log.description',
	overview: ({ message }) => [
		{
			label: '$t:operations.log.message',
			text: message,
		},
	],
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
				note: '$t:operation_variables_note',
			},
		},
	],
});
