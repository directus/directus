import { defineInterface } from '@directus/utils';
import Options from './options.vue';
import Interface from './iframe.vue';

export default defineInterface({
	id: 'iframe',
	name: '$t:interfaces.iframe.iframe',
	description: '$t:interfaces.iframe.description',
	icon: 'flip_to_front',
	component: Interface,
	types: ['string'],
	options: Options,
});
