import { defineInterface } from '@directus/extensions';
import PreviewSVG from './preview.svg?raw';
import InterfaceSelectIcon from './select-icon.vue';

export default defineInterface({
	id: 'select-icon',
	name: '$t:interfaces.select-icon.icon',
	description: '$t:interfaces.select-icon.description',
	icon: 'insert_emoticon',
	component: InterfaceSelectIcon,
	types: ['string'],
	group: 'selection',
	options: [],
	recommendedDisplays: ['icon'],
	preview: PreviewSVG,
});
