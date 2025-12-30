import InterfaceSystemOwner from './system-owner.vue';
import { defineInterface } from '@directus/extensions';

export default defineInterface({
	id: 'system-owner',
	name: '$t:interfaces.system-owner.system-owner',
	description: '$t:interfaces.system-owner.description',
	icon: 'vpn_key',
	component: InterfaceSystemOwner,
	system: true,
	types: ['string'],
	options: [],
});
