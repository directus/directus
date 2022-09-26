import { defineOperationApp } from '@directus/shared/utils';

export default defineOperationApp({
	id: 'trigger',
	icon: 'flag',
	name: '$t:operations.trigger.name',
	description: '$t:operations.trigger.description',
	overview: ({ flow }) => [
		{
			label: '$t:operations.trigger.flow',
			text: flow,
		},
	],
	options: [
		{
			field: 'flow',
			name: '$t:operations.trigger.flow',
			type: 'string',
			meta: {
				width: 'full',
				interface: 'input-autocomplete-api',
				options: {
					url: '/flows?search={{value}}&filter[trigger]=operation',
					resultsPath: 'data',
					textPath: 'name',
					valuePath: 'id',
					iconRight: 'bolt',
					placeholder: '$t:a_flow_uuid',
				},
			},
		},
		{
			field: 'payload',
			name: '$t:payload',
			type: 'json',
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
