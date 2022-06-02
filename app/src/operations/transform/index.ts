import { defineOperationApp } from '@directus/shared/utils';

export default defineOperationApp({
	id: 'transform',
	icon: 'move_down',
	name: '$t:operations.transform.name',
	description: '$t:operations.transform.description',
	overview: ({ json }) => [
		{
			label: '$t:json',
			text: json,
		},
	],
	options: [
		{
			field: 'json',
			name: '$t:json',
			type: 'string',
			meta: {
				width: 'full',
				interface: 'input-code',
				options: {
					language: 'json',
					placeholder: JSON.stringify(
						{
							user: '{{ $accountability.user }}',
							data: '{{ $last }}',
						},
						null,
						2
					),
					template: JSON.stringify(
						{
							user: '{{ $accountability.user }}',
							data: '{{ $last }}',
						},
						null,
						2
					),
				},
			},
		},
	],
});
