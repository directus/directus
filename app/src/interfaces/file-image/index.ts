import { defineInterface } from '@/interfaces/define';
import InterfaceFileImage from './file-image.vue';

export default defineInterface({
	id: 'file-image',
	name: '$t:interfaces.file-image.image',
	description: '$t:interfaces.file-image.description',
	icon: 'insert_photo',
	component: InterfaceFileImage,
	types: ['uuid'],
	groups: ['file'],
	relational: true,
	options: [],
	recommendedDisplays: ['image'],
});
