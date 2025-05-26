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
		];
	},
	recommendedDisplays: ['file'],
	preview: PreviewSVG,
});
