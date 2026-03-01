import { defineInterface } from '@directus/extensions';
import InterfaceFile from './file.vue';
import PreviewSVG from './preview.svg?raw';

export default defineInterface({
	id: 'file',
	name: '$t:interfaces.file.file',
	description: '$t:interfaces.file.description',
	icon: 'note_add',
	component: InterfaceFile,
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
					width: 'full',
					interface: 'system-folder',
					note: '$t:interfaces.system-folder.field_hint',
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
				field: 'allowedMimeTypes',
				name: '$t:interfaces.file.allowed_mime_types',
				type: 'json',
				meta: {
					interface: 'select-multiple-dropdown',
					options: {
						placeholder: '$t:interfaces.file.mime_types_placeholder',
						choices: [
							{ value: 'image/*', text: 'image/*' },
							{ value: 'video/*', text: 'video/*' },
							{ value: 'audio/*', text: 'audio/*' },
							{ value: 'text/*', text: 'text/*' },
							{ value: 'application/*', text: 'application/*' },
						],
						allowOther: true,
					},
					note: '$t:interfaces.file.mime_types_note',
				},
			},
		];
	},
	recommendedDisplays: ['file'],
	preview: PreviewSVG,
});
