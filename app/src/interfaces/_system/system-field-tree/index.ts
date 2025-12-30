import InterfaceSystemFieldTree from './system-field-tree.vue';
import { defineInterface } from '@directus/extensions';

export default defineInterface({
	id: 'system-field-tree',
	name: '$t:field',
	icon: 'box',
	component: InterfaceSystemFieldTree,
	types: ['string'],
	options: [],
	system: true,
});
