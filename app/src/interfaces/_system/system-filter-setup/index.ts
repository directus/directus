import { defineInterface } from '@/interfaces/define';
import InterfaceSystemFilterSetup from './system-filter-setup.vue';

export default defineInterface({
	id: 'system-filter-setup',
	name: 'Filter Setup',
	description: 'Configure the filter rules in style',
	icon: 'box',
	component: InterfaceSystemFilterSetup,
	types: ['json'],
	system: true,
	options: [],
});
