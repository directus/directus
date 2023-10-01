/* eslint-disable no-console */
import DisplayComponent from './display.vue';
import { defineDisplay } from '@directus/utils';


export default defineDisplay({
	id: 'translated_field',
	name: 'Translated field',
	icon: 'translate',
	description: 'Display field value in user\'s language',
	component: DisplayComponent,
	options: null,
	types: ['string', 'text'],
	localTypes: ['standard'],
	localFields: ['languages_id'],
});
