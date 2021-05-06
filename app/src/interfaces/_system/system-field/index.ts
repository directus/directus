import { defineInterface } from '@/interfaces/define';
import InterfaceSystemField from './field.vue';

export default defineInterface({
	id: 'system-field',
	name: '$t:field',
	icon: 'box',
	component: InterfaceSystemField,
	types: ['string'],
	options: [],
	system: true,
});
