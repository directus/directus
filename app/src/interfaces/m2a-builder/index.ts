import { defineInterface } from '../define';
import InterfaceManyToAny from './m2a-builder.vue';

export default defineInterface({
	id: 'm2a-builder',
	name: '$t:m2a_builder',
	icon: 'note_add',
	component: InterfaceManyToAny,
	relational: true,
	types: ['alias'],
	groups: ['m2a'],
	options: [],
});
