import InterfaceInlineFields from './system-inline-fields.vue';
import { defineInterface } from '@directus/extensions';

export default defineInterface({
	id: 'system-inline-fields',
	name: 'Inline Fields',
	description: 'Inline Fields',
	icon: 'box',
	component: InterfaceInlineFields,
	system: true,
	types: ['json'],
	group: 'standard',
	options: [],
});
