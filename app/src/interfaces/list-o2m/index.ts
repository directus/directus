import { defineInterface } from '@directus/shared/utils';
import InterfaceListO2M from './list-o2m.vue';
import PreviewSVG from './preview.svg?raw';

export default defineInterface({
	id: 'list-o2m',
	name: '$t:interfaces.list-o2m.one-to-many',
	description: '$t:interfaces.list-o2m.description',
	icon: 'arrow_right_alt',
	component: InterfaceListO2M,
	types: ['alias'],
	localTypes: ['o2m'],
	group: 'relational',
	relational: true,
	options: ({ relations, field: { meta } }) => {
		const collection = relations.o2m?.collection;
		const options = meta?.options ?? {};

		const tableOptions = [
			{
				field: 'tableSpacing',
				name: '$t:layouts.tabular.spacing',
				schema: {
					default_value: 'cozy',
				},
				meta: {
					interface: 'select-dropdown',
					options: {
						choices: [
							{
								text: '$t:layouts.tabular.compact',
								value: 'compact',
							},
							{
								text: '$t:layouts.tabular.cozy',
								value: 'cozy',
							},
							{
								text: '$t:layouts.tabular.comfortable',
								value: 'comfortable',
							},
						],
					},
					width: 'half',
				},
			},
			{
				field: 'fields',
				name: '$t:columns',
				meta: {
					interface: 'system-fields',
					options: {
						collectionName: collection,
					},
					width: 'full',
				},
			},
		];

		const listOptions = [
			{
				field: 'template',
				name: '$t:display_template',
				meta: {
					interface: 'system-display-template',
					options: {
						collectionName: collection,
					},
					width: 'full',
				},
			},
		];

		return [
			{
				field: 'layout',
				name: 'Layout',
				schema: {
					default_value: 'list',
				},
				meta: {
					interface: 'select-dropdown',
					options: {
						choices: [
							{
								text: 'List',
								value: 'list',
							},
							{
								text: 'Table',
								value: 'table',
							},
						],
					},
					width: 'half',
				},
			},
			...(options.layout === 'table' ? tableOptions : listOptions),
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
			{
				field: 'enableSearchFilter',
				name: 'Search & Filter',
				schema: {
					default_value: false,
				},
				meta: {
					interface: 'boolean',
					options: {
						label: 'Enable searching & filtering',
					},
					width: 'half',
				},
			},
			{
				field: 'enableLink',
				name: 'Item Link',
				schema: {
					default_value: false,
				},
				meta: {
					interface: 'boolean',
					options: {
						label: 'Show a link to the item',
					},
					width: 'half',
				},
			},
		];
	},
	recommendedDisplays: ['related-values'],
	preview: PreviewSVG,
});
