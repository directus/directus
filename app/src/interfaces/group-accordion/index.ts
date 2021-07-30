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
	options: [],
});
