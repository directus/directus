import { defineInterface } from '../define';
import InterfaceListO2M from './list-o2m.vue';
import Options from './options.vue';

export default defineInterface({
	id: 'list-o2m',
	name: '$t:interfaces.list-o2m.one-to-many',
	description: '$t:interfaces.list-o2m.description',
	icon: 'arrow_right_alt',
	component: InterfaceListO2M,
	types: ['alias'],
	groups: ['o2m'],
	relational: true,
	options: Options,
	recommendedDisplays: ['related-values'],
});
