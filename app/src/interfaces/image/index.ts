import { defineInterface } from '@/interfaces/define';
import InterfaceImage from './image.vue';

export default defineInterface({
	id: 'image',
	name: '$t:interfaces.image.image',
	description: '$t:interfaces.image.description',
	icon: 'insert_photo',
	component: InterfaceImage,
	types: ['uuid'],
	groups: ['file'],
	relational: true,
	options: [],
	recommendedDisplays: ['image'],
});
