import { defineInterface } from '@/interfaces/define';
import InterfaceField from './field.vue';

export default defineInterface({
	id: 'field',
	name: '$t:field',
	icon: 'box',
	component: InterfaceField,
	types: ['string'],
	options: [],
	system: true,
});
