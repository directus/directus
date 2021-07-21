import { defineInterface } from '../define';
import InterfaceTagsM2M from './tags-m2m.vue';
import Options from './options.vue';

export default defineInterface({
	id: 'many-to-many-reference',
	name: '$t:interfaces.tags-m2m.tags-m2m',
	description: '$t:interfaces.tags-m2m.description',
	icon: 'local_offer',
	component: InterfaceTagsM2M,
	relational: true,
	types: ['alias'],
	groups: ['m2m'],
	options: Options,
	recommendedDisplays: ['related-values'],
});
