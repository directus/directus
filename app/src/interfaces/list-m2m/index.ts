import { defineInterface } from '@directus/shared/utils';
import InterfaceListM2M from './list-m2m.vue';
import Options from './options.vue';

export default defineInterface({
	id: 'list-m2m',
	name: '$t:interfaces.list-m2m.many-to-many',
	description: '$t:interfaces.list-m2m.description',
	icon: 'note_add',
	component: InterfaceListM2M,
	relational: true,
	types: ['alias'],
	groups: ['m2m'],
	options: Options,
	recommendedDisplays: ['related-values'],
});
