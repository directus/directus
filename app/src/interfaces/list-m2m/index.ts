import { defineInterface } from '@directus/shared/utils';
import InterfaceListM2M from './list-m2m.vue';
import PreviewSVG from './preview.svg?raw';

export default defineInterface({
	id: 'list-m2m',
	name: '$t:interfaces.list-m2m.many-to-many',
	description: '$t:interfaces.list-m2m.description',
	icon: 'note_add',
	component: InterfaceListM2M,
	relational: true,
	types: ['alias'],
	localTypes: ['m2m'],
	group: 'relational',
	options: ({ editing, relations, field: { meta } }) => {
		const { collection, related_collection } = relations.o2m ?? {};
		const options = meta?.options ?? {};

		const displayTemplateMeta =
			editing === '+'
				? {
						interface: 'presentation-notice',
						options: {
							text: '$t:interfaces.list-m2m.display_template_configure_notice',
						},
				  }
				: {
						interface: 'system-display-template',
						options: {
							collectionName: collection,
						},
				  };

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
				meta: displayTemplateMeta,
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
						collectionName: related_collection,
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
