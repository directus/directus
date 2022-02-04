import { defineInterface } from '@directus/shared/utils';
import InterfaceGroupRaw from './group-raw.vue';

export default defineInterface({
	id: 'group-raw',
	name: '$t:interfaces.group-raw.name',
	description: '$t:interfaces.group-raw.description',
	icon: 'view_in_ar',
	component: InterfaceGroupRaw,
	localTypes: ['group'],
	group: 'group',
	types: ['alias'],
	options: [],
});
