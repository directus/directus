import { defineInterface } from '../define';
import InterfaceManyToMany from './many-to-many.vue';
import Options from './options.vue';

export default defineInterface({
	id: 'many-to-many',
	name: '$t:interfaces.many-to-many.many-to-many',
	description: '$t:interfaces.many-to-many.description',
	icon: 'note_add',
	component: InterfaceManyToMany,
	relational: true,
	types: ['alias'],
	groups: ['m2m', 'files'],
	options: Options,
	recommendedDisplays: ['related-values'],
});
