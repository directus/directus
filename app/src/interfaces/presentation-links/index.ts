import { defineInterface } from '@directus/shared/utils';
import InterfacePresentationLinks from './presentation-links.vue';
import Options from './options.vue';

export default defineInterface({
	id: 'presentation-links',
	name: '$t:interfaces.presentation-links.presentation-links',
	description: '$t:interfaces.presentation-links.description',
	icon: 'smart_button',
	component: InterfacePresentationLinks,
	hideLabel: true,
	hideLoader: true,
	types: ['alias'],
	groups: ['presentation'],
	options: Options,
});
