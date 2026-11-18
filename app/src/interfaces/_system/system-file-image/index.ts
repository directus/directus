import { defineInterface } from '@directus/extensions';
import InterfaceSystemFileImage from './system-file-image.vue';

export default defineInterface({
	id: 'system-file-image',
	name: '$t:interfaces.system-file-image.image',
	description: '$t:interfaces.system-file-image.description',
	icon: 'insert_photo',
	component: InterfaceSystemFileImage,
	types: ['uuid', 'string'],
	options: [],
	system: true,
});
