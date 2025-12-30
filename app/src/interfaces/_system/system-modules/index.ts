import InterfaceSystemModules from './system-modules.vue';
import { defineInterface } from '@directus/extensions';

export default defineInterface({
	id: 'system-modules',
	name: '$t:module_bar',
	icon: 'arrow_drop_down_circle',
	component: InterfaceSystemModules,
	types: ['json'],
	options: [],
	system: true,
});
