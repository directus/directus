import { defineInterface } from '../define';
import InterfaceIcon from './icon.vue';

export default defineInterface({
	id: 'icon',
	name: '$t:interfaces.icon.icon',
	description: '$t:interfaces.icon.description',
	icon: 'insert_emoticon',
	component: InterfaceIcon,
	types: ['string'],
	options: [],
	recommendedDisplays: ['icon'],
});
