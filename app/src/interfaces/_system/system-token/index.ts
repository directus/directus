import InterfaceSystemToken from './system-token.vue';
import { defineInterface } from '@directus/extensions';

export default defineInterface({
	id: 'system-token',
	name: '$t:interfaces.system-token.system-token',
	description: '$t:interfaces.system-token.description',
	icon: 'vpn_key',
	component: InterfaceSystemToken,
	system: true,
	types: ['hash'],
	options: [],
});
