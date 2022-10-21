import { defineOperationApp } from '@directus/shared/utils';
import { useFlowsStore } from '@/stores/flows';

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
	options: () => {
		const flowStore = useFlowsStore();
		const flowChoices = flowStore.flows
			.filter((flow) => flow.trigger === 'operation')
			.map((flow) => {
				return { text: flow.name, value: flow.id };
			});
		return [
			{
				field: 'flow',
				name: '$t:operations.trigger.flow',
				type: 'string',
				meta: {
					width: 'full',
					interface: 'select-dropdown',
					options: {
						choices: flowChoices,
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
		];
	},
});
