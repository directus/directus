import { defineInterface } from '../define';
import InterfaceOneToMany from './one-to-many.vue';
import Options from './options.vue';

export default defineInterface({
	id: 'one-to-many',
	name: '$t:interfaces.one-to-many.one-to-many',
	description: '$t:interfaces.one-to-many.description',
	icon: 'arrow_right_alt',
	component: InterfaceOneToMany,
	types: ['alias'],
	groups: ['o2m'],
	relational: true,
	options: Options,
	recommendedDisplays: ['related-values'],
});
