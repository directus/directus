import { defineInterface } from '@directus/extensions-sdk';
import InterfaceComponent from './interface.vue';

export default defineInterface({
	id: 'video-field',
	name: 'Video Field',
	icon: 'box',
	description: 'This is my custom interface!',
	component: InterfaceComponent,
	options: null,
	types: ['string'],
});
