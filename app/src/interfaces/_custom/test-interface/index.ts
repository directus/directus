import { defineInterface } from '@/interfaces/define';
import Interface from './custom-test-interface.vue';

export default defineInterface({
	id: 'custom-test-interface',
	name: 'Custom Test Interface',
	description: 'My Custom Interface!',
	icon: 'box',
	component: Interface,
	hideLabel: true,
	hideLoader: true,
	types: ['string'],
	options: [],
});
