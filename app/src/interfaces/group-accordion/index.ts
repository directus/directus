import { defineInterface } from '@directus/extensions';
import InterfaceGroupDivider from './group-accordion.vue';
import PreviewSVG from './preview.svg?raw';

export default defineInterface({
	id: 'group-accordion',
	name: '$t:interfaces.group-accordion.name',
	description: '$t:interfaces.group-accordion.description',
	icon: 'horizontal_split',
	component: InterfaceGroupDivider,
	hideLabel: true,
	hideLoader: true,
	autoKey: true,
	types: ['alias'],
	localTypes: ['group'],
	group: 'group',
	options: [
		{
			field: 'accordionMode',
			type: 'boolean',
			name: '$t:interfaces.group-accordion.accordion_mode',
			meta: {
				interface: 'boolean',
				options: {
					label: '$t:interfaces.group-accordion.max_one_section_open',
				},
				width: 'half',
			},
			schema: {
				default_value: true,
			},
		},
		{
			field: 'start',
			type: 'string',
			name: '$t:start',
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
							accordionMode: {
								_eq: false,
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
	preview: PreviewSVG,
});
