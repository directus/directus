import { defineInterface } from '@directus/utils';
import InterfaceFileImage from './file-image.vue';
import PreviewSVG from './preview.svg?raw';

export default defineInterface({
	id: 'file-image',
	name: '$t:interfaces.file-image.image',
	description: '$t:interfaces.file-image.description',
	icon: 'insert_photo',
	component: InterfaceFileImage,
	types: ['uuid'],
	localTypes: ['file'],
	group: 'relational',
	relational: true,
	options: [
		{
			field: 'folder',
			name: '$t:interfaces.system-folder.folder',
			type: 'uuid',
			meta: {
				width: 'half',
				interface: 'system-folder',
				note: '$t:interfaces.system-folder.field_hint',
			},
		},
		{
			field: 'crop',
			name: '$t:interfaces.file-image.crop',
			type: 'boolean',
			meta: {
				width: 'half',
				interface: 'boolean',
				options: {
					label: '$t:interfaces.file-image.crop_label',
				},
			},
			schema: {
				default_value: true,
			},
		},
	],
	recommendedDisplays: ['image'],
	preview: PreviewSVG,
});
