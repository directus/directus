import { defineDisplay } from '@directus/extensions-sdk';
import DisplayComponent from './display.vue';

export default defineDisplay({
	id: 'custom',
	name: 'Custom',
	description: 'This is my custom display!',
	icon: 'box',
	handler: DisplayComponent,
	types: ['string'],
	options: null,
});
