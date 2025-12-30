import InterfaceFileImage from './file-image.vue';
import PreviewSVG from './preview.svg?raw';
import { defineInterface } from '@directus/extensions';

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
	options: ({ relations }) => {
		const collection = relations.m2o?.related_collection;

		return [
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
			{
				field: 'filter',
				name: '$t:filter',
				type: 'json',
				meta: {
					interface: 'system-filter',
					options: {
						collectionName: collection,
					},
				},
			},
			{
				field: 'enableCreate',
				name: '$t:creating_items',
				schema: {
					default_value: true,
				},
				meta: {
					interface: 'boolean',
					options: {
						label: '$t:enable_create_button',
					},
					width: 'half',
				},
			},
			{
				field: 'enableSelect',
				name: '$t:selecting_items',
				schema: {
					default_value: true,
				},
				meta: {
					interface: 'boolean',
					options: {
						label: '$t:enable_select_button',
					},
					width: 'half',
				},
			},
			{
				field: 'letterbox',
				name: '$t:interfaces.file-image.letterbox',
				type: 'boolean',
				meta: {
					width: 'half',
					interface: 'boolean',
					options: {
						label: '$t:interfaces.file-image.letterbox_label',
					},
				},
				schema: {
					default_value: false,
				},
			},
		];
	},
	recommendedDisplays: ['image'],
	preview: PreviewSVG,
});
