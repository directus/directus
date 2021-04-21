import { defineInterface } from '@/interfaces/define';
import InterfaceInterface from './interface.vue';

export default defineInterface({
	id: 'interface',
	name: '$t:interfaces.interface.interface',
	description: '$t:interfaces.interface.description',
	icon: 'box',
	component: InterfaceInterface,
	types: ['string'],
	system: true,
	options: [],
});
