import { defineInterface } from '@directus/extensions';
import InterfaceListM2A from './list-m2a.vue';
import PreviewSVG from './preview.svg?raw';

export default defineInterface({
	id: 'list-m2a',
	name: '$t:list-m2a',
	icon: 'note_add',
	component: InterfaceListM2A,
	relational: true,
	types: ['alias'],
	localTypes: ['m2a'],
	group: 'relational',
	options: ({ editing, relations }) => [
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
		{
			field: 'allowDuplicates',
			name: '$t:allow_duplicates',
			schema: {
				default_value: false,
			},
			meta: {
				interface: 'boolean',
				width: 'half',
			},
		},
		{
			field: 'prefix',
			name: '$t:prefix',
			meta:
				editing === '+'
					? {
							interface: 'presentation-notice',
							options: {
								text: '$t:interfaces.list-m2m.display_template_configure_notice',
							},
						}
					: {
							interface: 'system-display-template',
							note: '$t:interfaces.list-m2a.prefix_note',
							options: {
								collectionName: relations.o2m?.collection,
							},
						},
		},
	],
	preview: PreviewSVG,
});
