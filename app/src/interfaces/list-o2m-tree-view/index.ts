import InterfaceListO2MTreeView from './list-o2m-tree-view.vue';
import PreviewSVG from './preview.svg?raw';
import { defineInterface } from '@directus/extensions';

export default defineInterface({
	id: 'list-o2m-tree-view',
	name: '$t:tree_view',
	description: '$t:interfaces.list-o2m-tree-view.description',
	icon: 'account_tree',
	types: ['alias'],
	localTypes: ['o2m'],
	group: 'relational',
	relational: true,
	component: InterfaceListO2MTreeView,
	options: ({ relations }) => {
		const collection = relations.o2m?.collection;

		return [
			{
				field: 'displayTemplate',
				name: '$t:display_template',
				meta: {
					interface: 'system-display-template',
					options: {
						collectionName: collection,
					},
					width: 'full',
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
				field: 'filter',
				name: '$t:filter',
				type: 'json',
				meta: {
					interface: 'system-filter',
					options: {
						collectionName: collection,
					},
					conditions: [
						{
							rule: {
								enableSelect: {
									_eq: false,
								},
							},
							hidden: true,
						},
					],
				},
			},
		];
	},
	preview: PreviewSVG,
});
