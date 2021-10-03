import { defineDisplay } from '@directus/shared/utils';
import DisplayLink from './link.vue';

export default defineDisplay({
	id: 'link',
	name: '$t:displays.link.link',
	description: '$t:displays.link.description',
	icon: 'open_in_new',
	component: DisplayLink,
	options: [],
	types: ['string'],
});
