import { defineInterface } from '@/interfaces/define';
import InterfaceOptions from './interface-options.vue';

export default defineInterface({
	id: 'interface-options',
	name: '$t:interfaces.interface-options.interface-options',
	description: '$t:interfaces.interface-options.description',
	icon: 'box',
	component: InterfaceOptions,
	types: ['string'],
	options: [],
	system: true,
});
