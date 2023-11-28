import { defineInterface } from '@directus/extensions';
import InterfaceSystemScope from './system-scope.vue';

export default defineInterface({
	id: 'system-scope',
	name: '$t:scope',
	icon: 'arrow_drop_down_circle',
	component: InterfaceSystemScope,
	types: ['string'],
	options: [],
	system: true,
});
