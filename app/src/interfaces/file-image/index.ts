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
	options: [
		{
			field: 'folder',
			name: '$t:interfaces.folder.folder',
			type: 'uuid',
			meta: {
				width: 'full',
				interface: 'system-folder',
				note: '$t:interfaces.system-folder.field_hint',
				options: {
					defaultLabel: 'system',
				},
			},
			schema: {
				default_value: null,
			},
		},
	],
	recommendedDisplays: ['image'],
});
