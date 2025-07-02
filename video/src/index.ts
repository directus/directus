import { defineInterface } from '@directus/extensions-sdk';
import InterfaceComponent from './interface.vue';

export default defineInterface({
	id: 'video',
	name: 'Video',
	icon: 'box',
	description: 'This is my custom video interface!',
	component: InterfaceComponent,
	options: null,
	types: ['string'],
});
