import { defineInterface } from '@directus/extensions';
import InterfaceSysteOwner from './system-owner.vue';

export default defineInterface({
	id: 'system-owner',
	name: '$t:interfaces.system-owner.system-owner',
	description: '$t:interfaces.system-owner.description',
	icon: 'vpn_key',
	component: InterfaceSysteOwner,
	system: true,
	types: ['string'],
	options: [],
});
