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
			},
			schema: {
				default_value: false,
			},
		},
	],
});
