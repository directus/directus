import { defineOperationApp } from '@directus/shared/utils';

export default defineOperationApp({
	id: 'condition',
	icon: 'rule',
	name: '$t:operations.condition.name',
	description: '$t:operations.condition.description',
	preview: ({ item }) => [
		{
			label: '$t:item',
			text: item,
		},
	],
	options: () => [
		{
			field: 'payload',
			name: '$t:input',
			type: 'string',
			schema: {
				default_value: '$last',
			},
			meta: {
				width: 'full',
				interface: 'select-radio',
				options: {
					choices: [
						{
							text: '$t:triggers.webhook.response_body_last',
							value: '$last',
						},
						{
							text: '$t:triggers.webhook.response_body_all',
							value: '$all',
						},
					],
					allowOther: true,
				},
			},
		},
		{
			field: 'filter',
			name: '$t:condition_rules',
			type: 'json',
			meta: {
				width: 'full',
				interface: 'input-code',
				options: {
					language: 'json',
					placeholder: `{
	"$trigger": {
		"category": {
			"_eq": "Example"
		}
	}
}`,
				},
			},
		},
	],
});
