import { defineInterface } from '@directus/extensions';
import InterfaceFiles from './files.vue';
import PreviewSVG from './preview.svg?raw';

export default defineInterface({
	id: 'files',
	name: '$t:interfaces.files.files',
	description: '$t:interfaces.files.description',
	icon: 'note_add',
	component: InterfaceFiles,
	relational: true,
	types: ['alias'],
	localTypes: ['files'],
	group: 'relational',
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
				field: 'template',
				name: '$t:display_template',
				meta: {
					interface: 'system-display-template',
					options: {
						collectionName: relations.o2m?.collection,
					},
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
				field: 'limit',
				name: '$t:per_page',
				type: 'integer',
				meta: {
					interface: 'input',
					width: 'half',
				},
				schema: {
					default_value: 15,
				},
			},
		];
	},
	recommendedDisplays: ['related-values'],
	preview: PreviewSVG,
});
