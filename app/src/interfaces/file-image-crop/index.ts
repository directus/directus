import { defineInterface } from '@directus/shared/utils';
import InterfaceFileImage from './file-image-crop.vue';
import PreviewSVG from './preview.svg?raw';

export default defineInterface({
	id: 'file-image-crop',
	name: '$t:interfaces.file-image-crop.image',
	description: '$t:interfaces.file-image-crop.description',
	icon: 'insert_photo',
	component: InterfaceFileImage,
	types: ['uuid'],
	localTypes: ['image_crops'],
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
			schema: {
				default_value: undefined,
			},
		},
		{
			field: 'crop',
			name: '$t:interfaces.file-image-crop.crop',
			type: 'boolean',
			meta: {
				width: 'half',
				interface: 'boolean',
				options: {
					label: '$t:interfaces.file-image-crop.crop_label',
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
