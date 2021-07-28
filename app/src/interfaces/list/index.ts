import { defineInterface } from '@directus/shared/utils';
import RepeaterOptions from './options.vue';
import InterfaceList from './list.vue';

export default defineInterface({
	id: 'list',
	name: '$t:interfaces.list.repeater',
	description: '$t:interfaces.list.description',
	icon: 'replay',
	component: InterfaceList,
	types: ['json'],
	options: RepeaterOptions,
});
