import { defineInterface } from '@directus/extensions';
import InterfaceSystemLicenseKey from './system-license-key.vue';

export default defineInterface({
	id: 'system-license-key',
	name: '$t:interfaces.system-license-key.system-license-key',
	description: '$t:interfaces.system-license-key.description',
	icon: 'vpn_key',
	component: InterfaceSystemLicenseKey,
	system: true,
	types: ['string'],
	options: [],
});
