import { defineInterface } from '@directus/shared/utils';
import InterfaceGroupDivider from './group-accordion.vue';

export default defineInterface({
	id: 'group-accordion',
	name: '$t:interfaces.group-accordion.name',
	description: '$t:interfaces.group-accordion.description',
	icon: 'horizontal_split',
	component: InterfaceGroupDivider,
	hideLabel: true,
	hideLoader: true,
	types: ['alias'],
	groups: ['group'],
	options: [
		{
			field: 'multiple',
			type: 'boolean',
			name: '$t:allow_multiple',
			meta: {
				interface: 'boolean',
				options: {
					label: '$t:allow_multiple_to_be_open',
				},
				width: 'half',
			},
			schema: {
				default_value: false,
			},
		},
		{
			field: 'start',
			type: 'string',
			name: '$t:interfaces.group-accordion.start',
			schema: {
				default_value: 'closed',
			},
			meta: {
				width: 'half',
				interface: 'select-dropdown',
				options: {
					choices: [
						{
							text: '$t:interfaces.group-accordion.all_closed',
							value: 'closed',
						},
						{
							text: '$t:interfaces.group-accordion.first_opened',
							value: 'first',
						},
					],
				},
				conditions: [
					{
						rule: {
							multiple: {
								_eq: true,
							},
						},
						options: {
							choices: [
								{
									text: '$t:interfaces.group-accordion.all_closed',
									value: 'closed',
								},
								{
									text: '$t:interfaces.group-accordion.first_opened',
									value: 'first',
								},
								{
									text: '$t:interfaces.group-accordion.all_opened',
									value: 'opened',
								},
							],
						},
					},
				],
			},
		},
	],
});
