import InterfaceSystemScope from './system-scope.vue';
import { defineInterface } from '@directus/extensions';

export default defineInterface({
	id: 'system-scope',
	name: '$t:scope',
	icon: 'arrow_drop_down_circle',
	component: InterfaceSystemScope,
	types: ['string'],
	options: [],
	system: true,
});
