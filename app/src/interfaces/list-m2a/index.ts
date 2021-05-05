import { defineInterface } from '../define';
import InterfaceListM2A from './list-m2a.vue';

export default defineInterface({
	id: 'list-m2a',
	name: '$t:list-m2a',
	icon: 'note_add',
	component: InterfaceListM2A,
	relational: true,
	types: ['alias'],
	groups: ['m2a'],
	options: [],
});
