import DisplayComponent from './display.vue';

export default {
	id: 'custom',
	name: 'Custom',
	description: 'This is my custom display!',
	icon: 'box',
	handler: DisplayComponent,
	types: ['string'],
	options: null,
};
