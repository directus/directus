import { defineOperationApp } from '@directus/extensions';
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
	options: (panel) => {
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
					width: 'half',
					interface: 'select-dropdown',
					options: {
						choices: flowChoices,
						iconRight: 'bolt',
						placeholder: '$t:a_flow_uuid',
					},
				},
			},
			{
				field: 'iterationMode',
				name: '$t:operations.trigger.iteration_mode',
				type: 'json',
				meta: {
					width: 'half',
					interface: 'select-dropdown',
					note: '$t:operations.trigger.iteration_mode_note',
					options: {
						choices: [
							{
								text: '$t:operations.trigger.parallel',
								value: 'parallel',
							},
							{
								text: '$t:operations.trigger.serial',
								value: 'serial',
							},
							{
								text: '$t:operations.trigger.batch',
								value: 'batch',
							},
						],
					},
				},
				schema: {
					default_value: 'parallel',
				},
			},
			...(panel.iterationMode === 'batch'
				? [
						{
							field: 'batchSize',
							name: '$t:operations.trigger.batch_size',
							type: 'integer',
							meta: {
								width: 'half',
								interface: 'input',
							},
							schema: {
								default_value: 10,
							},
						},
				  ]
				: []),
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
							2,
						),
						template: JSON.stringify(
							{
								user: '{{ $accountability.user }}',
								data: '{{ $last }}',
							},
							null,
							2,
						),
					},
				},
			},
		];
	},
});
